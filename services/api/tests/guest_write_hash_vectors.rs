//! W1.2 (AM-002, D-072): the guest writers' `Idempotency-Key` request hashes and stored answers as shared vectors
//! (`contracts/vectors/guest-write-hashes.json`), run here against `src/idempotency.rs` and the request and response
//! types, and by `tests/w12-guest-write-keys.test.ts` against `lib/invitation/guest-write-keys.ts`, so a form key recorded
//! by either writer replays in the other.

use invitesion_api::idempotency::request_hash;
use invitesion_api::rsvp::decision::{RsvpFlags, RsvpSubmission};
use invitesion_api::rsvp::http::RsvpSaved;
use invitesion_api::wishes::http::WishSaved;
use serde_json::Value;

fn vectors() -> Value {
    serde_json::from_str(include_str!("../../../contracts/vectors/guest-write-hashes.json"))
        .expect("guest-write-hashes.json parses")
}

fn text<'a>(case: &'a Value, field: &str) -> &'a str {
    case[field].as_str().unwrap_or_else(|| panic!("{field} is a string"))
}

#[test]
fn rsvp_request_hashes_match_the_typescript_writer() {
    for case in vectors()["rsvp"].as_array().expect("rsvp cases") {
        let name = text(case, "name");
        let submission: RsvpSubmission = serde_json::from_value(case["submission"].clone()).expect("a submission");
        let flags: RsvpFlags = serde_json::from_value(case["flags"].clone()).expect("the flags");
        let canonical = serde_json::to_string(&(&submission, &flags)).expect("serialises");
        assert_eq!(canonical, text(case, "canonical"), "{name}");
        assert_eq!(request_hash(&(&submission, &flags)), text(case, "expect"), "{name}");
    }
}

#[test]
fn wish_request_hashes_match_the_typescript_writer() {
    for case in vectors()["wish"].as_array().expect("wish cases") {
        let name = text(case, "name");
        let message = text(case, "message").to_string();
        assert_eq!(serde_json::to_string(&message).expect("serialises"), text(case, "canonical"), "{name}");
        assert_eq!(request_hash(&message), text(case, "expect"), "{name}");
    }
}

#[test]
fn stored_answers_have_the_shapes_both_writers_record() {
    let saved = &vectors()["saved"];
    for body in saved["rsvp"].as_array().expect("rsvp bodies") {
        let parsed: RsvpSaved = serde_json::from_value(body.clone()).expect("an RsvpSaved");
        assert_eq!(&serde_json::to_value(&parsed).expect("serialises"), body);
    }
    for body in saved["wish"].as_array().expect("wish bodies") {
        let parsed: WishSaved = serde_json::from_value(body.clone()).expect("a WishSaved");
        assert_eq!(&serde_json::to_value(&parsed).expect("serialises"), body);
    }
}
