//! G-044 (D-057): an invitation's team as the writers see it. The owner may do everything; a member's role grants a fixed
//! set of capabilities: the table in `lib/invitation/members.ts`, pinned by `contracts/vectors/member-roles.json`.
//! Next.js writes the grants (join links, acceptance, revocation: the Clerk boundary); these writers only read them, inside
//! their own transactions, so a revoked grant stops at the next request. A caller without the capability gets the
//! endpoint's `not_found`, exactly as for another owner's invitation.

use serde_json::Value;
use sqlx::{Postgres, Transaction};

/// The invitation's stored config when `user_id` may use `capability` on it now (its owner, or a live grant whose role
/// holds the capability: `callerMay` in `roster-next.ts`), else `None`. Every host writer asks this inside its own
/// transaction before it reads a stored answer for an idempotency key or changes a row, so a revoked member, another
/// account or another invitation never replays a cached answer or learns that its key exists.
pub async fn caller_may(
    tx: &mut Transaction<'_, Postgres>,
    user_id: i32,
    invitation_id: i32,
    capability: Capability,
) -> Result<Option<Value>, sqlx::Error> {
    let roles = capability.member_role_args();
    let row = sqlx::query!(
        "select i.config from invitations i where i.id = $1 and (i.user_id = $2 or exists (select 1 \
         from invitation_members m where m.invitation_id = i.id and m.user_id = $2 and m.revoked_at is null \
         and m.role = any($3)))",
        invitation_id,
        user_id,
        &roles[..]
    )
    .fetch_optional(&mut **tx)
    .await?;
    Ok(row.map(|row| row.config.unwrap_or(Value::Null)))
}

/// What the caller is about to do on an invitation.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Capability {
    /// The scanner's batches and a guest's check-in.
    Checkin,
    /// Every other roster write and the host's RSVP override.
    Guests,
    /// Wish moderation and replies.
    Wishes,
}

impl Capability {
    pub const ALL: [Capability; 3] = [Capability::Checkin, Capability::Guests, Capability::Wishes];

    /// The capability's name in the vectors.
    pub fn name(self) -> &'static str {
        match self {
            Capability::Checkin => "checkin",
            Capability::Guests => "guests",
            Capability::Wishes => "wishes",
        }
    }

    /// The member roles allowed this capability; the owner holds every capability.
    pub fn member_roles(self) -> &'static [&'static str] {
        match self {
            Capability::Checkin => &["cohost", "usher"],
            Capability::Guests => &["cohost"],
            Capability::Wishes => &["cohost"],
        }
    }

    /// The roles as the statement's `text[]` argument (`m.role = any($n)`).
    pub fn member_role_args(self) -> Vec<String> {
        self.member_roles().iter().map(|role| (*role).to_owned()).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::Capability;

    #[test]
    fn an_usher_only_checks_in_and_a_cohost_holds_every_writer_capability() {
        assert_eq!(Capability::Checkin.member_roles(), ["cohost", "usher"]);
        for capability in [Capability::Guests, Capability::Wishes] {
            assert!(!capability.member_roles().contains(&"usher"), "{}", capability.name());
            assert!(capability.member_roles().contains(&"cohost"), "{}", capability.name());
        }
        assert_eq!(Capability::Guests.member_role_args(), vec!["cohost".to_owned()]);
    }
}
