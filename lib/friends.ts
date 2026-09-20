import { db, ready } from "@/lib/db";
import { usernameKey } from "@/lib/accounts";

export type FriendState = "none" | "friends" | "sent" | "received";

export type FriendLink = { username: string; state: FriendState };

type LinkRow = { requester: string; addressee: string; status: string; display_name: string };

async function links(username: string): Promise<LinkRow[]> {
  await ready();
  return (await db()`
    select f.requester, f.addressee, f.status, u.display_name
    from friendships f
    join users u on u.username = case
      when f.requester = ${username} then f.addressee else f.requester end
    where f.requester = ${username} or f.addressee = ${username}
    order by f.created_at desc`) as LinkRow[];
}

function state(row: LinkRow, me: string): FriendState {
  if (row.status === "accepted") return "friends";
  return row.requester === me ? "sent" : "received";
}

/** Everyone this player is linked to, accepted or still pending either way. */
export async function listFriends(username: string): Promise<FriendLink[]> {
  const me = usernameKey(username);
  return (await links(me)).map((row) => ({ username: row.display_name, state: state(row, me) }));
}

export async function friendState(username: string, other: string): Promise<FriendState> {
  const me = usernameKey(username);
  const them = usernameKey(other);
  if (me === them) return "none";
  await ready();
  const rows = (await db()`
    select requester, addressee, status, '' as display_name from friendships
    where (requester = ${me} and addressee = ${them})
       or (requester = ${them} and addressee = ${me})`) as LinkRow[];
  return rows[0] ? state(rows[0], me) : "none";
}

/**
 * Asks to link with someone, or accepts their pending ask — sending a request
 * to a player who already sent you one is how you become friends.
 */
export async function requestFriend(username: string, other: string): Promise<FriendState> {
  const me = usernameKey(username);
  const them = usernameKey(other);
  if (me === them) return "none";
  await ready();

  const accepted = await db()`
    update friendships set status = 'accepted'
    where requester = ${them} and addressee = ${me} and status = 'pending'
    returning requester`;
  if (accepted.length > 0) return "friends";

  await db()`
    insert into friendships (requester, addressee, status)
    values (${me}, ${them}, 'pending')
    on conflict (requester, addressee) do nothing`;
  return friendState(me, them);
}

export async function removeFriend(username: string, other: string): Promise<void> {
  const me = usernameKey(username);
  const them = usernameKey(other);
  await ready();
  await db()`delete from friendships
    where (requester = ${me} and addressee = ${them})
       or (requester = ${them} and addressee = ${me})`;
}
