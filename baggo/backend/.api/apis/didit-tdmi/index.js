import Oas from 'oas';
import APICore from 'api/dist/core';
import definition from './openapi.json';
class SDK {
    constructor() {
        this.spec = Oas.init(definition);
        this.core = new APICore(this.spec, 'didit-tdmi/1.0.0 (api/6.1.3)');
    }
    /**
     * Optionally configure various options that the SDK allows.
     *
     * @param config Object of supported SDK options and toggles.
     * @param config.timeout Override the default `fetch` request timeout of 30 seconds. This number
     * should be represented in milliseconds.
     */
    config(config) {
        this.core.setConfig(config);
    }
    /**
     * If the API you're using requires authentication you can supply the required credentials
     * through this method and the library will magically determine how they should be used
     * within your API request.
     *
     * With the exception of OpenID and MutualTLS, it supports all forms of authentication
     * supported by the OpenAPI specification.
     *
     * @example <caption>HTTP Basic auth</caption>
     * sdk.auth('username', 'password');
     *
     * @example <caption>Bearer tokens (HTTP or OAuth 2)</caption>
     * sdk.auth('myBearerToken');
     *
     * @example <caption>API Keys</caption>
     * sdk.auth('myApiKey');
     *
     * @see {@link https://spec.openapis.org/oas/v3.0.3#fixed-fields-22}
     * @see {@link https://spec.openapis.org/oas/v3.1.0#fixed-fields-22}
     * @param values Your auth credentials for the API; can specify up to two strings or numbers.
     */
    auth(...values) {
        this.core.setAuth(...values);
        return this;
    }
    /**
     * If the API you're using offers alternate server URLs, and server variables, you can tell
     * the SDK which one to use with this method. To use it you can supply either one of the
     * server URLs that are contained within the OpenAPI definition (along with any server
     * variables), or you can pass it a fully qualified URL to use (that may or may not exist
     * within the OpenAPI definition).
     *
     * @example <caption>Server URL with server variables</caption>
     * sdk.server('https://{region}.api.example.com/{basePath}', {
     *   name: 'eu',
     *   basePath: 'v14',
     * });
     *
     * @example <caption>Fully qualified server URL</caption>
     * sdk.server('https://eu.api.example.com/v14');
     *
     * @param url Server URL
     * @param variables An object of variables to replace into the server URL.
     */
    server(url, variables = {}) {
        this.core.setServer(url, variables);
    }
    /**
     * The Create Session API allows you to generate a url for a specific workflow where your
     * users can start verifying their identity.
     *
     * @summary Create Session
     * @throws FetchError<400, types.PostV2SessionResponse400> Bad Request
     * @throws FetchError<403, types.PostV2SessionResponse403> Forbidden
     */
    post_v2session(body, metadata) {
        return this.core.fetch('/v2/session/', 'post', body, metadata);
    }
    /**
     * The Retrieve Session API allows you to retrieve the results of a verification session.
     *
     * @summary Retrieve Session
     */
    get_v2sessionSessionIdDecision(metadata) {
        return this.core.fetch('/v2/session/{sessionId}/decision/', 'get', metadata);
    }
    /**
     * The Delete Session API allows you to delete a verification session with all their data
     * associated.
     *
     * @summary Delete Session
     * @throws FetchError<404, types.DeleteV1SessionSessionIdResponse404> Not Found
     */
    delete_v1sessionSessionId(metadata) {
        return this.core.fetch('/v1/session/{sessionId}/delete/', 'delete', metadata);
    }
    /**
     * The Generate PDF API allows you to generate a PDF report for a verification session.
     *
     * @summary Generate PDF
     */
    get_v1sessionSessionIdGeneratePdf(metadata) {
        return this.core.fetch('/v1/session/{sessionId}/generate-pdf', 'get', metadata);
    }
    /**
     * The Update Status API allows you to update the status of a finished verification session
     * programatically.
     *
     * @summary Update Status
     * @throws FetchError<400, types.PatchV1SessionSessionIdUpdateStatusResponse400> Bad Request
     */
    patch_v1sessionSessionIdUpdateStatus(body, metadata) {
        return this.core.fetch('/v1/session/{sessionId}/update-status/', 'patch', body, metadata);
    }
    /**
     * The ID Verification API allows you to verify identity documents by submitting images of
     * the document's front and back sides (when applicable). This API extracts and validates
     * document information, performs authenticity checks, and returns structured data from the
     * document.
     *
     * @summary ID Verification
     * @throws FetchError<400, types.PostV2IdVerificationResponse400> Bad Request
     * @throws FetchError<403, types.PostV2IdVerificationResponse403> Forbidden
     */
    post_v2idVerification(body, metadata) {
        return this.core.fetch('/v2/id-verification/', 'post', body, metadata);
    }
    /**
     * The Face Match API enables you to compare two facial images to determine if they belong
     * to the same person. It is ideal for identity verification, access control, and user
     * authentication. <br>**Note**: If multiple faces appear in an image, the API uses the
     * face with the largest area to calculate the similarity score.
     *
     * @summary Face Match
     * @throws FetchError<403, types.PostV2FaceMatchResponse403> Forbidden
     */
    post_v2faceMatch(body, metadata) {
        return this.core.fetch('/v2/face-match/', 'post', body, metadata);
    }
    /**
     * The Age Estimation API allows you to estimate a person's age based on facial analysis.
     * This API can be used for age verification, demographic analysis, or personalized user
     * experiences. Additionally, we perform a passive liveness test to ensure the submitted
     * image is of a real person and not a spoof attempt.
     *
     * @summary Age Estimation
     * @throws FetchError<403, types.PostV2AgeEstimationResponse403> Forbidden
     */
    post_v2ageEstimation(body, metadata) {
        return this.core.fetch('/v2/age-estimation/', 'post', body, metadata);
    }
    /**
     * The Proof of Address (POA) Verification API allows you to verify address documents by
     * submitting document images or PDFs. This API extracts and validates address information,
     * performs authenticity checks, and returns structured data from the document.
     *
     * @summary Proof of Address
     * @throws FetchError<400, types.PostV2PoaResponse400> Bad Request
     * @throws FetchError<403, types.PostV2PoaResponse403> Forbidden
     */
    post_v2poa(body, metadata) {
        return this.core.fetch('/v2/poa/', 'post', body, metadata);
    }
    /**
     * The AML Screening API allows you to screen individuals against global watchlists and
     * high-risk databases. This API provides real-time screening capabilities to detect
     * potential matches and mitigate risks associated with financial fraud and terrorism.
     *
     * @summary AML Screening
     * @throws FetchError<403, types.PostV2AmlResponse403> Forbidden
     */
    post_v2aml(body, metadata) {
        return this.core.fetch('/v2/aml/', 'post', body, metadata);
    }
    /**
     * The Face Search API allows you to search for faces in a database of previously verified
     * faces. This API can be used for identity verification, access control, and user
     * authentication.
     *
     * @summary Face Search
     * @throws FetchError<400, types.PostV2FaceSearchResponse400> Bad Request
     * @throws FetchError<403, types.PostV2FaceSearchResponse403> Forbidden
     */
    post_v2faceSearch(body, metadata) {
        return this.core.fetch('/v2/face-search/', 'post', body, metadata);
    }
    /**
     * The List Sessions API retrieves a list of verification session results for your
     * application. You can filter the results using optional query parameters, such as
     * `vendor_data`, to narrow down the sessions returned.
     *
     * @summary List Sessions
     */
    get_organizationsOrg_idApplicationApp_idSessions(metadata) {
        return this.core.fetch('/v2/sessions', 'get', metadata);
    }
    /**
     * Didit's Share KYC via API feature enables trusted partners to securely share user
     * verification data. This is ideal for scenarios where a user is onboarded on one platform
     * and needs to access a partner service, eliminating the need for the user to undergo the
     * verification process again. This business-to-business sharing streamlines user
     * experience across integrated services. Learn more at [Share KYC via
     * API](/reference/share-kyc-via-api#/).
     *
     * @summary Share Session
     * @throws FetchError<400, types.PostV1SessionSessionIdShareResponse400> Bad Request
     * @throws FetchError<403, types.PostV1SessionSessionIdShareResponse403> Forbidden
     */
    post_v1sessionSessionIdShare(body, metadata) {
        return this.core.fetch('/v1/session/{sessionId}/share/', 'post', body, metadata);
    }
    /**
     * The Import Shared Session API is used by partners to import shared verification sessions
     * for Reusable KYC. Learn more at [Share KYC via API](/reference/share-kyc-via-api#/).
     *
     * @summary Import Shared Session
     * @throws FetchError<400, types.PostV1SessionimportSharedResponse400> Bad Request
     * @throws FetchError<403, types.PostV1SessionimportSharedResponse403> Forbidden
     */
    post_v1sessionimportShared(body, metadata) {
        return this.core.fetch('/v1/session/import-shared/', 'post', body, metadata);
    }
    /**
     * The passive liveness API allows you to verify that a user is physically present by
     * analyzing a captured image without requiring any explicit movement or interaction from
     * the user.
     *
     * @summary Passive Liveness
     * @throws FetchError<403, types.PostV2PassiveLivenessResponse403> Forbidden
     */
    post_v2passiveLiveness(body, metadata) {
        return this.core.fetch('/v2/passive-liveness/', 'post', body, metadata);
    }
    /**
     * The Database Validation API allows you to validate user-provided identity data against
     * authoritative national and global data sources. Supporting both 1x1 and 2x2 matching
     * methods, this API uses a waterfall approach to maximize match rates by sequentially
     * querying multiple providers until a full, conclusive match is found. It enables
     * real-time identity verification, helping you reduce fraud, streamline onboarding, and
     * ensure compliance with regulatory requirements.
     *
     * @summary Database Validation
     * @throws FetchError<403, types.PostV2DatabaseValidationResponse403> Forbidden
     */
    post_v2databaseValidation(body, metadata) {
        return this.core.fetch('/v2/database-validation/', 'post', body, metadata);
    }
    /**
     * This endpoint sends a one-time verification code to a specified phone number. It
     * automatically handles blocked numbers and supports a single retry in case the initial
     * attempt fails. Retries are free of charge. The verification code remains valid for 5
     * minutes from the time it is sent.
     *
     * @summary Send Phone Code
     * @throws FetchError<401, types.PostV2PhoneSendResponse401> Unauthorized
     * @throws FetchError<403, types.PostV2PhoneSendResponse403> Forbidden
     * @throws FetchError<429, types.PostV2PhoneSendResponse429> Too Many Requests
     */
    post_v2phone_send(body, metadata) {
        return this.core.fetch('/v2/phone/send/', 'post', body, metadata);
    }
    /**
     * This endpoint verifies a one-time code sent to a phone number and returns information
     * about the number. There is a maximum of three verification attempts per code.
     *
     * @summary Check Phone Code
     * @throws FetchError<401, types.PostV2PhoneCheckResponse401> Unauthorized
     * @throws FetchError<403, types.PostV2PhoneCheckResponse403> Forbidden
     * @throws FetchError<404, types.PostV2PhoneCheckResponse404> Not Found
     */
    post_v2phone_check(body, metadata) {
        return this.core.fetch('/v2/phone/check/', 'post', body, metadata);
    }
    /**
     * This endpoint sends a one-time verification code to a specified email address. It
     * automatically handles undeliverable emails and supports a single retry in case the
     * initial attempt fails. Retries are free of charge. The verification code remains valid
     * for 5 minutes from the time it is sent.
     *
     * @summary Send Email Code
     * @throws FetchError<401, types.PostV2EmailSendResponse401> Unauthorized
     * @throws FetchError<403, types.PostV2EmailSendResponse403> Forbidden
     */
    post_v2email_send(body, metadata) {
        return this.core.fetch('/v2/email/send/', 'post', body, metadata);
    }
    /**
     * This endpoint verifies a one-time code sent to an email address and returns information
     * about the email. There is a maximum of three verification attempts per code.
     *
     * @summary Check Email Code
     * @throws FetchError<401, types.PostV2EmailCheckResponse401> Unauthorized
     * @throws FetchError<403, types.PostV2EmailCheckResponse403> Forbidden
     * @throws FetchError<404, types.PostV2EmailCheckResponse404> Not Found
     */
    post_v2email_check(body, metadata) {
        return this.core.fetch('/v2/email/check/', 'post', body, metadata);
    }
}
const createSDK = (() => { return new SDK(); })();
export default createSDK;
