"""
Social / Messaging router
Endpoints: search users, friend requests, group chat, direct messages.
WebSocket:  /ws/social/{user_id}?token=...  — real-time message delivery.
"""

import json
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from db import get_db, User, Friendship, ChatGroup, GroupMember, SocialMessage, Challenge, ChallengeParticipant
from auth import get_current_user, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/social", tags=["social"])


# ── WebSocket connection manager ──────────────────────────────────

class _Manager:
    def __init__(self):
        self._sockets: dict[int, WebSocket] = {}

    async def connect(self, user_id: int, ws: WebSocket):
        await ws.accept()
        self._sockets[user_id] = ws

    def disconnect(self, user_id: int):
        self._sockets.pop(user_id, None)

    async def send(self, user_id: int, payload: dict):
        ws = self._sockets.get(user_id)
        if ws:
            try:
                await ws.send_json(payload)
            except Exception:
                self.disconnect(user_id)

    def online_ids(self) -> set[int]:
        return set(self._sockets.keys())


manager = _Manager()


# ── Helpers ───────────────────────────────────────────────────────

def _dm_chat_id(a: int, b: int) -> str:
    lo, hi = (a, b) if a < b else (b, a)
    return f"dm_{lo}_{hi}"


def _user_dict(u: User) -> dict:
    return {"id": u.id, "name": u.name, "email": u.email}


def _msg_dict(m: SocialMessage, sender_name: str) -> dict:
    return {
        "id": m.id,
        "chat_id": m.chat_id,
        "sender_id": m.sender_id,
        "sender_name": sender_name,
        "content": m.content,
        "msg_type": m.msg_type or "text",
        "voice_data": m.voice_data,
        "created_at": m.created_at.isoformat(),
    }


# ── Pydantic models ───────────────────────────────────────────────

class FriendRequestBody(BaseModel):
    addressee_id: int

class GroupCreateBody(BaseModel):
    name: str

class AddMemberBody(BaseModel):
    user_id: int

class SendMessageBody(BaseModel):
    chat_id: str
    content: str
    msg_type: str = "text"    # text | voice
    voice_data: Optional[str] = None   # base64 audio

class ChallengeCreateBody(BaseModel):
    name: str
    goal_level: str
    deadline: Optional[str] = None    # ISO date string

class ChallengeInviteBody(BaseModel):
    user_id: int

class ChallengeProgressBody(BaseModel):
    progress_pct: int
    share_progress: bool


# ── User search ───────────────────────────────────────────────────

@router.get("/search")
def search_users(
    q: str = Query(..., min_length=1),
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    results = (
        db.query(User)
        .filter(
            User.id != me.id,
            (User.name.ilike(f"%{q}%") | User.email.ilike(f"%{q}%")),
        )
        .limit(20)
        .all()
    )
    return [_user_dict(u) for u in results]


# ── Friends ───────────────────────────────────────────────────────

@router.get("/friends")
def list_friends(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(Friendship).filter(
        (Friendship.requester_id == me.id) | (Friendship.addressee_id == me.id)
    ).all()

    online = manager.online_ids()
    accepted, pending_in, pending_out = [], [], []

    for f in rows:
        other_id = f.addressee_id if f.requester_id == me.id else f.requester_id
        other = db.query(User).get(other_id)
        if not other:
            continue
        entry = {**_user_dict(other), "friendship_id": f.id, "online": other_id in online}
        if f.status == "accepted":
            accepted.append(entry)
        elif f.status == "pending" and f.addressee_id == me.id:
            pending_in.append(entry)
        elif f.status == "pending" and f.requester_id == me.id:
            pending_out.append(entry)

    return {"accepted": accepted, "pending_in": pending_in, "pending_out": pending_out}


@router.post("/friends/request", status_code=201)
async def send_friend_request(
    body: FriendRequestBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if body.addressee_id == me.id:
        raise HTTPException(400, "Cannot add yourself")

    target = db.query(User).get(body.addressee_id)
    if not target:
        raise HTTPException(404, "User not found")

    existing = db.query(Friendship).filter(
        ((Friendship.requester_id == me.id) & (Friendship.addressee_id == body.addressee_id)) |
        ((Friendship.requester_id == body.addressee_id) & (Friendship.addressee_id == me.id))
    ).first()
    if existing:
        raise HTTPException(409, "Request already exists")

    f = Friendship(requester_id=me.id, addressee_id=body.addressee_id, status="pending")
    db.add(f)
    db.commit()
    db.refresh(f)

    # Notify the target in real-time if connected
    await manager.send(body.addressee_id, {
        "type": "friend_request",
        "from": _user_dict(me),
        "friendship_id": f.id,
    })

    return {"friendship_id": f.id}


@router.put("/friends/{fid}/accept")
async def accept_friend_request(
    fid: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    f = db.query(Friendship).get(fid)
    if not f or f.addressee_id != me.id:
        raise HTTPException(404, "Request not found")
    if f.status != "pending":
        raise HTTPException(400, "Already handled")

    f.status = "accepted"
    db.commit()

    await manager.send(f.requester_id, {
        "type": "friend_accepted",
        "by": _user_dict(me),
        "friendship_id": fid,
    })

    return {"ok": True}


@router.delete("/friends/{fid}")
def remove_friend(
    fid: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    f = db.query(Friendship).get(fid)
    if not f or (f.requester_id != me.id and f.addressee_id != me.id):
        raise HTTPException(404, "Not found")
    db.delete(f)
    db.commit()
    return {"ok": True}


# ── Groups ────────────────────────────────────────────────────────

@router.get("/groups")
def list_groups(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    memberships = db.query(GroupMember).filter(GroupMember.user_id == me.id).all()
    result = []
    for m in memberships:
        g = db.query(ChatGroup).get(m.group_id)
        if not g:
            continue
        members = db.query(GroupMember).filter(GroupMember.group_id == g.id).all()
        member_users = [_user_dict(db.query(User).get(mm.user_id)) for mm in members if db.query(User).get(mm.user_id)]
        result.append({
            "id": g.id,
            "name": g.name,
            "creator_id": g.creator_id,
            "chat_id": f"group_{g.id}",
            "members": member_users,
        })
    return result


@router.post("/groups", status_code=201)
def create_group(
    body: GroupCreateBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    g = ChatGroup(name=body.name.strip(), creator_id=me.id)
    db.add(g)
    db.flush()
    db.add(GroupMember(group_id=g.id, user_id=me.id))
    db.commit()
    db.refresh(g)
    return {"id": g.id, "name": g.name, "chat_id": f"group_{g.id}"}


@router.post("/groups/{gid}/members", status_code=201)
async def add_member(
    gid: int,
    body: AddMemberBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    g = db.query(ChatGroup).get(gid)
    if not g:
        raise HTTPException(404, "Group not found")
    if g.creator_id != me.id:
        raise HTTPException(403, "Only creator can add members")

    target = db.query(User).get(body.user_id)
    if not target:
        raise HTTPException(404, "User not found")

    exists = db.query(GroupMember).filter(
        GroupMember.group_id == gid, GroupMember.user_id == body.user_id
    ).first()
    if exists:
        raise HTTPException(409, "Already a member")

    db.add(GroupMember(group_id=gid, user_id=body.user_id))
    db.commit()

    await manager.send(body.user_id, {
        "type": "added_to_group",
        "group": {"id": g.id, "name": g.name, "chat_id": f"group_{g.id}"},
        "by": _user_dict(me),
    })

    return {"ok": True}


@router.delete("/groups/{gid}/members/{uid}")
def remove_member(
    gid: int,
    uid: int,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    g = db.query(ChatGroup).get(gid)
    if not g:
        raise HTTPException(404)
    if g.creator_id != me.id and uid != me.id:
        raise HTTPException(403)
    m = db.query(GroupMember).filter(GroupMember.group_id == gid, GroupMember.user_id == uid).first()
    if m:
        db.delete(m)
        db.commit()
    return {"ok": True}


# ── Messages ──────────────────────────────────────────────────────

def _assert_chat_access(chat_id: str, me_id: int, db: Session):
    """Raise 403 if the current user has no access to this chat."""
    if chat_id.startswith("dm_"):
        parts = chat_id.split("_")
        ids = {int(parts[1]), int(parts[2])}
        if me_id not in ids:
            raise HTTPException(403, "No access")
    elif chat_id.startswith("group_"):
        gid = int(chat_id.split("_")[1])
        m = db.query(GroupMember).filter(
            GroupMember.group_id == gid, GroupMember.user_id == me_id
        ).first()
        if not m:
            raise HTTPException(403, "Not a member")
    elif chat_id.startswith("challenge_"):
        cid = int(chat_id.split("_")[1])
        p = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == cid,
            ChallengeParticipant.user_id == me_id,
        ).first()
        if not p:
            raise HTTPException(403, "Not a participant")
    else:
        raise HTTPException(400, "Invalid chat_id")


@router.get("/messages/{chat_id}")
def get_messages(
    chat_id: str,
    before_id: Optional[int] = None,
    limit: int = Query(50, le=100),
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_chat_access(chat_id, me.id, db)
    q = db.query(SocialMessage).filter(SocialMessage.chat_id == chat_id)
    if before_id:
        q = q.filter(SocialMessage.id < before_id)
    msgs = q.order_by(SocialMessage.id.desc()).limit(limit).all()
    msgs.reverse()

    user_cache: dict[int, str] = {}
    result = []
    for m in msgs:
        if m.sender_id not in user_cache:
            u = db.query(User).get(m.sender_id)
            user_cache[m.sender_id] = u.name if u else "?"
        result.append(_msg_dict(m, user_cache[m.sender_id]))
    return result


@router.post("/messages", status_code=201)
async def send_message(
    body: SendMessageBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    _assert_chat_access(body.chat_id, me.id, db)

    if not body.content.strip():
        raise HTTPException(400, "Empty message")

    msg = SocialMessage(
        chat_id=body.chat_id,
        sender_id=me.id,
        content=body.content.strip() if body.content else "",
        msg_type=body.msg_type,
        voice_data=body.voice_data,
    )
    db.add(msg)
    db.commit()
    db.refresh(msg)

    payload = {
        "type": "message",
        **_msg_dict(msg, me.name),
    }

    # Deliver to all participants who are connected
    if body.chat_id.startswith("dm_"):
        parts = body.chat_id.split("_")
        for uid in [int(parts[1]), int(parts[2])]:
            if uid != me.id:
                await manager.send(uid, payload)
    elif body.chat_id.startswith("group_"):
        gid = int(body.chat_id.split("_")[1])
        members = db.query(GroupMember).filter(GroupMember.group_id == gid).all()
        for mm in members:
            if mm.user_id != me.id:
                await manager.send(mm.user_id, payload)
    elif body.chat_id.startswith("challenge_"):
        cid = int(body.chat_id.split("_")[1])
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == cid
        ).all()
        for pp in participants:
            if pp.user_id != me.id:
                await manager.send(pp.user_id, payload)

    return payload


# ── Challenges ───────────────────────────────────────────────────

@router.get("/challenges")
def list_challenges(
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rows = db.query(ChallengeParticipant).filter(ChallengeParticipant.user_id == me.id).all()
    result = []
    for p in rows:
        c = db.query(Challenge).get(p.challenge_id)
        if not c:
            continue
        participants = db.query(ChallengeParticipant).filter(
            ChallengeParticipant.challenge_id == c.id
        ).all()
        parts_out = []
        for pp in participants:
            u = db.query(User).get(pp.user_id)
            if not u:
                continue
            entry = {"user_id": pp.user_id, "name": u.name, "joined_at": pp.joined_at.isoformat()}
            # Only reveal progress if the participant opted in OR it's me
            if pp.share_progress or pp.user_id == me.id:
                entry["progress_pct"] = pp.progress_pct
                entry["share_progress"] = pp.share_progress
            parts_out.append(entry)
        result.append({
            "id": c.id,
            "name": c.name,
            "goal_level": c.goal_level,
            "creator_id": c.creator_id,
            "deadline": c.deadline.isoformat() if c.deadline else None,
            "chat_id": f"challenge_{c.id}",
            "my_progress": p.progress_pct,
            "my_share": p.share_progress,
            "participants": parts_out,
        })
    return result


@router.post("/challenges", status_code=201)
async def create_challenge(
    body: ChallengeCreateBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    deadline_dt = None
    if body.deadline:
        try:
            deadline_dt = datetime.fromisoformat(body.deadline)
        except ValueError:
            pass
    c = Challenge(
        name=body.name.strip(),
        goal_level=body.goal_level.lower(),
        creator_id=me.id,
        deadline=deadline_dt,
    )
    db.add(c)
    db.flush()
    db.add(ChallengeParticipant(challenge_id=c.id, user_id=me.id, share_progress=True))
    db.commit()
    db.refresh(c)
    return {"id": c.id, "name": c.name, "chat_id": f"challenge_{c.id}"}


@router.post("/challenges/{cid}/invite", status_code=201)
async def invite_to_challenge(
    cid: int,
    body: ChallengeInviteBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    c = db.query(Challenge).get(cid)
    if not c:
        raise HTTPException(404, "Challenge not found")
    if c.creator_id != me.id:
        raise HTTPException(403, "Only the creator can invite")

    target = db.query(User).get(body.user_id)
    if not target:
        raise HTTPException(404, "User not found")

    exists = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == cid,
        ChallengeParticipant.user_id == body.user_id,
    ).first()
    if exists:
        raise HTTPException(409, "Already a participant")

    db.add(ChallengeParticipant(challenge_id=cid, user_id=body.user_id, share_progress=False))
    db.commit()

    await manager.send(body.user_id, {
        "type": "challenge_invite",
        "challenge": {"id": c.id, "name": c.name, "goal_level": c.goal_level, "chat_id": f"challenge_{c.id}"},
        "from": _user_dict(me),
    })
    return {"ok": True}


@router.put("/challenges/{cid}/progress")
def update_challenge_progress(
    cid: int,
    body: ChallengeProgressBody,
    me: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    p = db.query(ChallengeParticipant).filter(
        ChallengeParticipant.challenge_id == cid,
        ChallengeParticipant.user_id == me.id,
    ).first()
    if not p:
        raise HTTPException(404, "Not a participant")
    p.progress_pct = max(0, min(100, body.progress_pct))
    p.share_progress = body.share_progress
    db.commit()
    return {"ok": True}


# ── WebSocket ─────────────────────────────────────────────────────

def _ws_auth(token: str, db: Session) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if not email:
            return None
        u = db.query(User).filter(User.email == email).first()
        return u.id if u else None
    except JWTError:
        return None


async def websocket_endpoint(ws: WebSocket, user_id: int, token: str = "", db: Session = None):
    if db is None:
        await ws.close(code=1008)
        return

    verified_id = _ws_auth(token, db)
    if verified_id != user_id:
        await ws.close(code=1008)
        return

    await manager.connect(user_id, ws)
    try:
        while True:
            raw = await ws.receive_text()
            if raw == "ping":
                continue
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            msg_type = msg.get("type", "")
            # WebRTC call signaling — relay to target peer
            if msg_type in ("call_offer", "call_answer", "ice_candidate", "call_end", "call_reject"):
                target_id = msg.get("target_id")
                if target_id:
                    await manager.send(int(target_id), {**msg, "from_id": user_id})
    except WebSocketDisconnect:
        manager.disconnect(user_id)
