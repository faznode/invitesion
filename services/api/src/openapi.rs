//! The OpenAPI 3.1 document, generated from the handler and type annotations (utoipa). `openapi.json` is the
//! committed copy; `lib/api/schema.d.ts` is generated from it, and CI fails when either drifts
//! (`scripts/api/contract.sh check`).

use utoipa::openapi::security::{ApiKey, ApiKeyValue, HttpAuthScheme, HttpBuilder, SecurityScheme};
use utoipa::{Modify, OpenApi};

use crate::health::Health;
use crate::identity::Me;
use crate::problem::Problem;
use crate::rsvp::decision::{EventFields, RsvpFlags, RsvpSubmission};
use crate::rsvp::http::{GuestRsvpRequest, HostRsvpFlags, HostRsvpRequest, HostRsvpStatus, RsvpSaved};
use crate::service_auth::SIGNATURE_HEADER;
use crate::views::{RecordView, ViewRecorded};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Invitesion API",
        version = "0.1.0",
        description = "Domain API (ADR-A2). Server-to-server only: every operation except liveness requires the internal service signature."
    ),
    paths(
        crate::health::health,
        crate::health::ready,
        crate::identity::me,
        crate::views::record_view,
        crate::rsvp::http::guest_rsvp,
        crate::rsvp::http::host_rsvp_override
    ),
    components(schemas(
        Problem,
        Health,
        Me,
        RecordView,
        ViewRecorded,
        GuestRsvpRequest,
        RsvpSubmission,
        EventFields,
        RsvpFlags,
        RsvpSaved,
        HostRsvpRequest,
        HostRsvpFlags,
        HostRsvpStatus
    )),
    modifiers(&SecuritySchemes),
    tags(
        (name = "health", description = "Liveness and readiness"),
        (name = "identity", description = "Owner-token verification"),
        (name = "views", description = "Invitation opens (R-02)"),
        (name = "rsvp", description = "Guest RSVP and the host's override (R-03)")
    )
)]
pub struct ApiDoc;

struct SecuritySchemes;

impl Modify for SecuritySchemes {
    fn modify(&self, openapi: &mut utoipa::openapi::OpenApi) {
        let components = openapi.components.get_or_insert_with(Default::default);
        components.add_security_scheme(
            "serviceSignature",
            SecurityScheme::ApiKey(ApiKey::Header(ApiKeyValue::with_description(
                SIGNATURE_HEADER,
                "t=<unix seconds>,v1=<hex HMAC-SHA256 of t.METHOD.path_and_query.sha256hex(body)>",
            ))),
        );
        components.add_security_scheme(
            "ownerToken",
            SecurityScheme::Http(HttpBuilder::new().scheme(HttpAuthScheme::Bearer).bearer_format("JWT").build()),
        );
    }
}

/// The document as committed: pretty JSON with a trailing newline.
pub fn document_json() -> String {
    let mut json = ApiDoc::openapi().to_pretty_json().expect("the OpenAPI document serialises");
    json.push('\n');
    json
}
