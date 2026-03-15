declare const DeleteV1SessionSessionId: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sessionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["sessionId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "204": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetOrganizationsOrgIdApplicationAppIdSessions: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly vendor_data: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
                };
                readonly country: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "ISO 3166-1 alpha-3 country code representing the country of the country of the applicant's ID document, which may differ from nationality. For example, `GBR`.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The status of the verification session. For a complete list of possible verification statuses, refer to the [Verification Statuses](/reference/verification-statuses/) page.";
                };
                readonly workflow_id: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The identifier of the verification workflow to filter sessions by. You can find this ID on the Workflows page in the Console.";
                };
                readonly offset: {
                    readonly type: "string";
                    readonly default: "0";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The number of items to skip before starting to return results.";
                };
                readonly limit: {
                    readonly type: "string";
                    readonly default: "20";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The maximum number of items to return in the response.";
                };
            };
            readonly required: readonly [];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly count: {
                    readonly type: "integer";
                    readonly examples: readonly [2];
                };
                readonly next: {
                    readonly type: "string";
                };
                readonly previous: {
                    readonly type: "string";
                };
                readonly results: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly session_id: {
                                readonly type: "string";
                                readonly format: "uuid";
                                readonly examples: readonly ["5b3720ed-d429-42ef-b67f-37ea805f48ee"];
                            };
                            readonly session_number: {
                                readonly type: "integer";
                                readonly examples: readonly [720];
                            };
                            readonly portrait_image: {
                                readonly type: "string";
                                readonly examples: readonly ["https://example.com/portrait"];
                            };
                            readonly document_type: {
                                readonly type: "string";
                                readonly examples: readonly ["ID"];
                            };
                            readonly full_name: {
                                readonly type: "string";
                                readonly examples: readonly ["Alejandro Rosas"];
                            };
                            readonly country: {
                                readonly type: "string";
                                readonly examples: readonly ["ESP"];
                            };
                            readonly status: {
                                readonly type: "string";
                                readonly examples: readonly ["Approved"];
                            };
                            readonly vendor_data: {
                                readonly type: "string";
                                readonly examples: readonly ["user-1"];
                            };
                            readonly created_at: {
                                readonly type: "string";
                                readonly format: "date-time";
                                readonly examples: readonly ["2025-06-09T12:26:54.328364Z"];
                            };
                            readonly features: {
                                readonly type: "array";
                                readonly items: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly feature: {
                                            readonly type: "string";
                                            readonly examples: readonly ["ID_VERIFICATION"];
                                        };
                                        readonly status: {
                                            readonly type: "string";
                                            readonly examples: readonly ["Approved"];
                                        };
                                    };
                                };
                            };
                            readonly phone_number: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly number: {
                                        readonly type: "string";
                                        readonly examples: readonly ["+14155552671"];
                                    };
                                    readonly is_verified: {
                                        readonly type: "boolean";
                                        readonly examples: readonly [true];
                                    };
                                };
                            };
                            readonly email_address: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly email: {
                                        readonly type: "string";
                                        readonly examples: readonly ["test@example.com"];
                                    };
                                    readonly is_verified: {
                                        readonly type: "boolean";
                                        readonly examples: readonly [true];
                                    };
                                };
                            };
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetV1SessionSessionIdGeneratePdf: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sessionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["sessionId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const GetV2SessionSessionIdDecision: {
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sessionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The unique identifier of the session for which to retrieve verification results.";
                };
            };
            readonly required: readonly ["sessionId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly session_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "The unique identifier of the session for which to retrieve verification results.";
                };
                readonly session_number: {
                    readonly type: "integer";
                    readonly description: "The number of the session.";
                };
                readonly session_url: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly description: "The URL of the session.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly description: "The status of the session.";
                };
                readonly workflow_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "The unique identifier of the workflow for which to retrieve verification results.";
                };
                readonly features: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "string";
                        readonly description: "The feature of the session.";
                    };
                };
                readonly vendor_data: {
                    readonly type: "string";
                    readonly description: "The vendor data of the session.";
                };
                readonly metadata: {
                    readonly type: "object";
                    readonly description: "The metadata of the session.";
                    readonly additionalProperties: true;
                };
                readonly expected_details: {
                    readonly type: "object";
                    readonly description: "Expected user details for cross-validation with extracted verification data.";
                    readonly properties: {
                        readonly first_name: {
                            readonly type: "string";
                            readonly description: "User's first name. For example, `John`.";
                        };
                        readonly last_name: {
                            readonly type: "string";
                            readonly description: "User's last name. For example, `Doe`.";
                        };
                        readonly date_of_birth: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly description: "User's date of birth with format: YYYY-MM-DD. For example, `1990-05-15`.";
                        };
                        readonly gender: {
                            readonly type: "string";
                            readonly enum: readonly ["M", "F"];
                            readonly default: any;
                            readonly description: "User's gender. Must be either 'M', 'F', or null.\n\n`M` `F`";
                        };
                        readonly nationality: {
                            readonly type: "string";
                            readonly description: "ISO 3166-1 alpha-3 country code representing the applicant's country of origin. For example, `USA`.";
                        };
                        readonly country: {
                            readonly type: "string";
                            readonly description: "ISO 3166-1 alpha-3 country code representing the country of the Proof of Address document, or the country of the applicant's ID document, which may differ from nationality. For example, `GBR`.";
                        };
                        readonly address: {
                            readonly type: "string";
                            readonly description: "The address in a human readable format, including as much information as possible. For example, `123 Main St, San Francisco, CA 94105, USA`.";
                        };
                        readonly identification_number: {
                            readonly type: "string";
                            readonly description: "The user's document number, personal number, or tax number. For example, `123456789`.";
                        };
                        readonly ip_address: {
                            readonly type: "string";
                            readonly format: "ipv4";
                            readonly description: "Expected IP address for the session. If the actual IP address differs from this value, a warning will be logged. For example, `192.168.1.100`.";
                        };
                    };
                };
                readonly contact_details: {
                    readonly type: "object";
                    readonly description: "User contact information that can be used for notifications, prefilling verification forms, and phone verification. This includes email address, preferred language for communications, and phone number.";
                    readonly properties: {
                        readonly email: {
                            readonly type: "string";
                            readonly description: "Email address of the user (e.g., \"john.doe@example.com\") that will be used during the Email Verification step. If not provided, the user must provide it during the verification flow.";
                        };
                        readonly email_lang: {
                            readonly type: "string";
                            readonly description: "Language code (ISO 639-1) for email notifications. Controls the language of all email communications (e.g., \"en\", \"es\", \"fr\").";
                        };
                        readonly send_notification_emails: {
                            readonly type: "boolean";
                            readonly default: false;
                            readonly description: "If true, sends verification status notifications for sessions requiring manual review to the provided email address.";
                        };
                        readonly phone: {
                            readonly type: "string";
                            readonly description: "Phone number of the user in E.164 format if available (e.g., +14155552671).";
                        };
                    };
                };
                readonly callback: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly description: "The callback URL of the session.";
                };
                readonly id_verification: {
                    readonly type: "object";
                    readonly description: "The ID verification of the session.";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the ID verification";
                        };
                        readonly document_type: {
                            readonly type: "string";
                            readonly description: "Type of identity document";
                        };
                        readonly document_number: {
                            readonly type: "string";
                            readonly description: "Document identification number";
                        };
                        readonly personal_number: {
                            readonly type: "string";
                            readonly description: "Personal identification number";
                        };
                        readonly portrait_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the portrait image";
                        };
                        readonly front_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the front document image";
                        };
                        readonly front_video: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the front document video";
                        };
                        readonly back_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the back document image";
                        };
                        readonly back_video: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the back document video";
                        };
                        readonly full_front_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the full front document image";
                        };
                        readonly full_back_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the full back document image";
                        };
                        readonly date_of_birth: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly description: "Date of birth from document";
                        };
                        readonly age: {
                            readonly type: "integer";
                            readonly description: "Calculated age from date of birth";
                        };
                        readonly expiration_date: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly description: "Document expiration date";
                        };
                        readonly date_of_issue: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly description: "Document issue date";
                        };
                        readonly issuing_state: {
                            readonly type: "string";
                            readonly description: "ISO code of issuing state";
                        };
                        readonly issuing_state_name: {
                            readonly type: "string";
                            readonly description: "Full name of issuing state";
                        };
                        readonly first_name: {
                            readonly type: "string";
                            readonly description: "First name from document";
                        };
                        readonly last_name: {
                            readonly type: "string";
                            readonly description: "Last name from document";
                        };
                        readonly full_name: {
                            readonly type: "string";
                            readonly description: "Full name from document";
                        };
                        readonly gender: {
                            readonly type: "string";
                            readonly description: "Gender from document";
                        };
                        readonly address: {
                            readonly type: "string";
                            readonly description: "Raw address from document";
                        };
                        readonly formatted_address: {
                            readonly type: "string";
                            readonly description: "Formatted full address";
                        };
                        readonly place_of_birth: {
                            readonly type: "string";
                            readonly description: "Place of birth from document";
                        };
                        readonly marital_status: {
                            readonly type: "string";
                            readonly description: "Marital status from document";
                        };
                        readonly nationality: {
                            readonly type: "string";
                            readonly description: "ISO nationality code";
                        };
                        readonly extra_fields: {
                            readonly type: "object";
                            readonly description: "Additional document fields";
                            readonly properties: {
                                readonly dl_categories: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly blood_group: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly parsed_address: {
                            readonly type: "object";
                            readonly description: "Structured address details";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                    readonly format: "uuid";
                                };
                                readonly address_type: {
                                    readonly type: "string";
                                };
                                readonly city: {
                                    readonly type: "string";
                                };
                                readonly label: {
                                    readonly type: "string";
                                };
                                readonly region: {
                                    readonly type: "string";
                                };
                                readonly street_1: {
                                    readonly type: "string";
                                };
                                readonly street_2: {
                                    readonly type: "string";
                                };
                                readonly postal_code: {
                                    readonly type: "string";
                                };
                                readonly raw_results: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly geometry: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly location: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly lat: {
                                                            readonly type: "number";
                                                        };
                                                        readonly lng: {
                                                            readonly type: "number";
                                                        };
                                                    };
                                                };
                                                readonly location_type: {
                                                    readonly type: "string";
                                                };
                                                readonly viewport: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly northeast: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly lat: {
                                                                    readonly type: "number";
                                                                };
                                                                readonly lng: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                        readonly southwest: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly lat: {
                                                                    readonly type: "number";
                                                                };
                                                                readonly lng: {
                                                                    readonly type: "number";
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                        readonly extra_files: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly format: "uri";
                            };
                            readonly description: "Additional document verification files";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly description: "Document verification warnings";
                        };
                    };
                };
                readonly nfc: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                        };
                        readonly portrait_image: {
                            readonly type: "string";
                            readonly format: "uri";
                        };
                        readonly signature_image: {
                            readonly type: "string";
                            readonly format: "uri";
                        };
                        readonly chip_data: {
                            readonly type: "object";
                            readonly properties: {
                                readonly document_type: {
                                    readonly type: "string";
                                };
                                readonly issuing_country: {
                                    readonly type: "string";
                                };
                                readonly document_number: {
                                    readonly type: "string";
                                };
                                readonly expiration_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                };
                                readonly first_name: {
                                    readonly type: "string";
                                };
                                readonly last_name: {
                                    readonly type: "string";
                                };
                                readonly birth_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                };
                                readonly gender: {
                                    readonly type: "string";
                                };
                                readonly nationality: {
                                    readonly type: "string";
                                };
                                readonly address: {
                                    readonly type: "string";
                                };
                                readonly place_of_birth: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly authenticity: {
                            readonly type: "object";
                            readonly properties: {
                                readonly sod_integrity: {
                                    readonly type: "boolean";
                                };
                                readonly dg_integrity: {
                                    readonly type: "boolean";
                                };
                            };
                        };
                        readonly certificate_summary: {
                            readonly type: "object";
                            readonly properties: {
                                readonly issuer: {
                                    readonly type: "string";
                                };
                                readonly subject: {
                                    readonly type: "string";
                                };
                                readonly serial_number: {
                                    readonly type: "string";
                                };
                                readonly not_valid_after: {
                                    readonly type: "string";
                                    readonly format: "date-time";
                                };
                                readonly not_valid_before: {
                                    readonly type: "string";
                                    readonly format: "date-time";
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly liveness: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the liveness check";
                        };
                        readonly method: {
                            readonly type: "string";
                            readonly description: "Method used for liveness detection";
                        };
                        readonly score: {
                            readonly type: "number";
                            readonly description: "Confidence score of the liveness check";
                        };
                        readonly reference_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the reference image used";
                        };
                        readonly video_url: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the liveness check video";
                        };
                        readonly age_estimation: {
                            readonly type: "number";
                            readonly description: "Estimated age of the person";
                        };
                        readonly matches: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly session_id: {
                                        readonly type: "string";
                                    };
                                    readonly session_number: {
                                        readonly type: "integer";
                                    };
                                    readonly similarity_percentage: {
                                        readonly type: "number";
                                    };
                                    readonly vendor_data: {
                                        readonly type: "string";
                                    };
                                    readonly verification_date: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                    };
                                    readonly user_details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly name: {
                                                readonly type: "string";
                                            };
                                            readonly document_type: {
                                                readonly type: "string";
                                            };
                                            readonly document_number: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly match_image_url: {
                                        readonly type: "string";
                                        readonly format: "uri";
                                    };
                                    readonly status: {
                                        readonly type: "string";
                                    };
                                    readonly is_blocklisted: {
                                        readonly type: "boolean";
                                    };
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly face_match: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the face match verification";
                        };
                        readonly score: {
                            readonly type: "number";
                            readonly description: "Confidence score of the face match";
                        };
                        readonly source_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the source image used for comparison";
                        };
                        readonly target_image: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the target image used for comparison";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                            readonly description: "Face match verification warnings";
                        };
                    };
                };
                readonly phone: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the phone verification";
                        };
                        readonly phone_number_prefix: {
                            readonly type: "string";
                            readonly description: "Country calling code prefix";
                        };
                        readonly phone_number: {
                            readonly type: "string";
                            readonly description: "Phone number without country prefix";
                        };
                        readonly full_number: {
                            readonly type: "string";
                            readonly description: "Complete phone number with country prefix";
                        };
                        readonly country_code: {
                            readonly type: "string";
                            readonly description: "Two-letter country code (ISO 3166-1 alpha-2)";
                        };
                        readonly country_name: {
                            readonly type: "string";
                            readonly description: "Full country name";
                        };
                        readonly carrier: {
                            readonly type: "object";
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                    readonly description: "Name of the phone carrier";
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly description: "Type of phone line (mobile, landline, etc)";
                                };
                            };
                        };
                        readonly is_disposable: {
                            readonly type: "boolean";
                            readonly description: "Whether the phone number is from a disposable service";
                        };
                        readonly is_virtual: {
                            readonly type: "boolean";
                            readonly description: "Whether the phone number is virtual";
                        };
                        readonly verification_method: {
                            readonly type: "string";
                            readonly description: "Method used to verify the phone number";
                        };
                        readonly verification_attempts: {
                            readonly type: "integer";
                            readonly description: "Number of verification attempts made";
                        };
                        readonly verified_at: {
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly description: "Timestamp when the phone was verified";
                        };
                        readonly lifecycle: {
                            readonly type: "array";
                            readonly description: "Chronological list of events in the phone verification lifecycle.";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly timestamp: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                    };
                                    readonly details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly status: {
                                                readonly type: "string";
                                            };
                                            readonly reason: {
                                                readonly type: "string";
                                            };
                                            readonly is_retry: {
                                                readonly type: "boolean";
                                            };
                                            readonly code_tried: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly fee: {
                                        readonly type: "number";
                                    };
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly description: "List of warnings related to phone verification";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly email: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the email verification";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly description: "The email address being verified";
                        };
                        readonly is_breached: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email was found in known data breaches";
                        };
                        readonly breaches: {
                            readonly type: "array";
                            readonly description: "List of known breaches this email was found in";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly name: {
                                        readonly type: "string";
                                        readonly description: "Name of the breach";
                                    };
                                    readonly domain: {
                                        readonly type: "string";
                                        readonly description: "Domain affected by the breach";
                                    };
                                    readonly logo_path: {
                                        readonly type: "string";
                                        readonly description: "URL to the logo of the breached service";
                                    };
                                    readonly breach_date: {
                                        readonly type: "string";
                                        readonly format: "date";
                                        readonly description: "Date when the breach occurred";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                        readonly description: "Description of the breach";
                                    };
                                    readonly is_verified: {
                                        readonly type: "boolean";
                                        readonly description: "Whether the breach is verified";
                                    };
                                    readonly data_classes: {
                                        readonly type: "array";
                                        readonly description: "Types of data exposed in the breach";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly breach_emails_count: {
                                        readonly type: "integer";
                                        readonly description: "Number of email addresses affected in the breach";
                                    };
                                };
                            };
                        };
                        readonly is_disposable: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email is from a disposable provider";
                        };
                        readonly is_undeliverable: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email address is undeliverable";
                        };
                        readonly verification_attempts: {
                            readonly type: "integer";
                            readonly description: "Number of verification attempts for this email";
                        };
                        readonly verified_at: {
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly description: "Timestamp when the email was verified";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly description: "List of warnings related to email verification";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly feature: {
                                        readonly type: "string";
                                    };
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                        readonly lifecycle: {
                            readonly type: "array";
                            readonly description: "Chronological list of events in the email verification lifecycle.";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly timestamp: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                    };
                                    readonly details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly status: {
                                                readonly type: "string";
                                            };
                                            readonly reason: {
                                                readonly type: "string";
                                            };
                                            readonly code_tried: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly fee: {
                                        readonly type: "number";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly poa: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the proof of address verification";
                        };
                        readonly document_file: {
                            readonly type: "string";
                            readonly format: "uri";
                            readonly description: "URL of the proof of address document";
                        };
                        readonly issuing_state: {
                            readonly type: "string";
                            readonly description: "Two-letter country code of the issuing state";
                        };
                        readonly document_type: {
                            readonly type: "string";
                            readonly description: "Type of proof of address document";
                        };
                        readonly document_language: {
                            readonly type: "string";
                            readonly description: "Language code of the document";
                        };
                        readonly document_metadata: {
                            readonly type: "object";
                            readonly properties: {
                                readonly file_size: {
                                    readonly type: "integer";
                                    readonly description: "Size of the document";
                                };
                                readonly content_type: {
                                    readonly type: "string";
                                    readonly description: "Content type of the document";
                                };
                                readonly creation_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                    readonly description: "Date when the document was created";
                                };
                                readonly modified_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                    readonly description: "Date when the document was modified";
                                };
                            };
                        };
                        readonly issuer: {
                            readonly type: "string";
                            readonly description: "Name of the document issuer";
                        };
                        readonly issue_date: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly description: "Date when the document was issued";
                        };
                        readonly poa_address: {
                            readonly type: "string";
                            readonly description: "Raw address from the proof of address document";
                        };
                        readonly poa_formatted_address: {
                            readonly type: "string";
                            readonly description: "Formatted address from the proof of address document";
                        };
                        readonly poa_parsed_address: {
                            readonly type: "object";
                            readonly properties: {
                                readonly address_type: {
                                    readonly type: "string";
                                    readonly description: "Type of address (Street, Avenue, etc)";
                                };
                                readonly street_1: {
                                    readonly type: "string";
                                    readonly description: "Primary street address";
                                };
                                readonly street_2: {
                                    readonly type: "string";
                                    readonly description: "Secondary street address";
                                };
                                readonly city: {
                                    readonly type: "string";
                                    readonly description: "City name";
                                };
                                readonly region: {
                                    readonly type: "string";
                                    readonly description: "Region or state name";
                                };
                                readonly country: {
                                    readonly type: "string";
                                    readonly description: "Two-letter country code";
                                };
                                readonly postal_code: {
                                    readonly type: "string";
                                    readonly description: "Postal code";
                                };
                                readonly document_location: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly latitude: {
                                            readonly type: "number";
                                            readonly description: "Latitude coordinate";
                                        };
                                        readonly longitude: {
                                            readonly type: "number";
                                            readonly description: "Longitude coordinate";
                                        };
                                    };
                                };
                            };
                        };
                        readonly expected_details_address: {
                            readonly type: "string";
                            readonly description: "Expected raw address for verification";
                        };
                        readonly expected_details_formatted_address: {
                            readonly type: "string";
                            readonly description: "Expected formatted address for verification";
                        };
                        readonly expected_details_parsed_address: {
                            readonly type: "object";
                            readonly description: "Expected parsed address details for verification";
                            readonly additionalProperties: true;
                        };
                        readonly extra_files: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                                readonly format: "uri";
                            };
                            readonly description: "Additional proof of address files";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly questionnaire: {
                    readonly type: "object";
                    readonly properties: {
                        readonly questionnaire_id: {
                            readonly type: "string";
                            readonly description: "Unique identifier for the questionnaire";
                        };
                        readonly title: {
                            readonly type: "string";
                            readonly description: "Title of the questionnaire";
                        };
                        readonly description: {
                            readonly type: "string";
                            readonly description: "Description of the questionnaire";
                        };
                        readonly languages: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "string";
                            };
                            readonly description: "Supported languages";
                        };
                        readonly default_language: {
                            readonly type: "string";
                            readonly description: "Default language";
                        };
                        readonly is_active: {
                            readonly type: "boolean";
                            readonly description: "Whether the questionnaire is active";
                        };
                        readonly sections: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly title: {
                                        readonly type: "string";
                                        readonly description: "Section title";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                        readonly description: "Section description";
                                    };
                                    readonly items: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly uuid: {
                                                    readonly type: "string";
                                                    readonly description: "Unique identifier for the item";
                                                };
                                                readonly order: {
                                                    readonly type: "integer";
                                                    readonly description: "Order of the item in the section";
                                                };
                                                readonly element_type: {
                                                    readonly type: "string";
                                                    readonly description: "Type of the questionnaire element";
                                                };
                                                readonly is_required: {
                                                    readonly type: "boolean";
                                                    readonly description: "Whether the item is required";
                                                };
                                                readonly title: {
                                                    readonly type: "string";
                                                    readonly description: "Title of the item";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                    readonly description: "Description of the item";
                                                };
                                                readonly placeholder: {
                                                    readonly type: "string";
                                                    readonly description: "Placeholder text";
                                                };
                                                readonly choices: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly label: {
                                                                readonly type: "string";
                                                            };
                                                            readonly value: {
                                                                readonly type: "string";
                                                            };
                                                            readonly requires_text_input: {
                                                                readonly type: "boolean";
                                                                readonly description: "Whether this choice requires additional text input";
                                                            };
                                                        };
                                                        readonly required: readonly ["label", "value"];
                                                    };
                                                    readonly description: "Choices for dropdown or single choice elements";
                                                };
                                                readonly max_files: {
                                                    readonly type: "integer";
                                                    readonly description: "Maximum number of files allowed";
                                                };
                                                readonly answer: {
                                                    readonly type: "object";
                                                    readonly description: "Answer provided for the item";
                                                    readonly properties: {
                                                        readonly value: {
                                                            readonly type: "string";
                                                        };
                                                        readonly text: {
                                                            readonly type: "string";
                                                        };
                                                        readonly files: {
                                                            readonly type: "array";
                                                            readonly items: {
                                                                readonly type: "string";
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly required: readonly ["uuid", "order", "element_type", "is_required", "title"];
                                        };
                                    };
                                };
                            };
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the questionnaire";
                        };
                    };
                };
                readonly aml: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the AML screening";
                        };
                        readonly total_hits: {
                            readonly type: "integer";
                            readonly description: "Total number of matches found";
                        };
                        readonly hits: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                        readonly description: "Unique identifier of the match";
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                        readonly format: "uri";
                                        readonly description: "Source URL for the match";
                                    };
                                    readonly match: {
                                        readonly type: "boolean";
                                        readonly description: "Whether this is a confirmed match";
                                    };
                                    readonly score: {
                                        readonly type: "integer";
                                        readonly description: "Match score";
                                    };
                                    readonly target: {
                                        readonly type: "string";
                                        readonly description: "Target of the match";
                                    };
                                    readonly caption: {
                                        readonly type: "string";
                                        readonly description: "Caption or title of the match";
                                    };
                                    readonly datasets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly description: "List of datasets where match was found";
                                    };
                                    readonly features: {
                                        readonly type: "object";
                                        readonly description: "Additional features of the match";
                                        readonly additionalProperties: true;
                                    };
                                    readonly rca_name: {
                                        readonly type: "string";
                                        readonly description: "RCA name if applicable";
                                    };
                                    readonly last_seen: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly description: "Date when match was last seen";
                                    };
                                    readonly risk_view: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly crimes: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly additionalProperties: true;
                                                    };
                                                };
                                            };
                                            readonly countries: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly additionalProperties: true;
                                                    };
                                                };
                                            };
                                            readonly categories: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly additionalProperties: true;
                                                    };
                                                };
                                            };
                                            readonly custom_list: {
                                                readonly type: "object";
                                                readonly additionalProperties: true;
                                            };
                                        };
                                    };
                                    readonly first_seen: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly description: "Date when match was first seen";
                                    };
                                    readonly properties: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly name: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly alias: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly notes: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly title: {
                                                readonly type: "string";
                                            };
                                            readonly gender: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly height: {
                                                readonly type: "string";
                                            };
                                            readonly topics: {
                                                readonly type: "string";
                                            };
                                            readonly weight: {
                                                readonly type: "string";
                                            };
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly country: {
                                                readonly type: "string";
                                            };
                                            readonly website: {
                                                readonly type: "string";
                                            };
                                            readonly eyeColor: {
                                                readonly type: "string";
                                            };
                                            readonly keywords: {
                                                readonly type: "string";
                                            };
                                            readonly lastName: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly position: {
                                                readonly type: "string";
                                            };
                                            readonly religion: {
                                                readonly type: "string";
                                            };
                                            readonly birthDate: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly education: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly ethnicity: {
                                                readonly type: "string";
                                            };
                                            readonly firstName: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly hairColor: {
                                                readonly type: "string";
                                            };
                                            readonly weakAlias: {
                                                readonly type: "string";
                                            };
                                            readonly birthPlace: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                            };
                                            readonly modifiedAt: {
                                                readonly type: "string";
                                            };
                                            readonly wikidataId: {
                                                readonly type: "string";
                                            };
                                            readonly citizenship: {
                                                readonly type: "string";
                                            };
                                            readonly nationality: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly match_score: {
                                        readonly type: "integer";
                                        readonly description: "Score indicating match confidence";
                                    };
                                    readonly pep_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly aliases: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly education: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly list_name: {
                                                    readonly type: "string";
                                                };
                                                readonly publisher: {
                                                    readonly type: "string";
                                                };
                                                readonly source_url: {
                                                    readonly type: "string";
                                                    readonly format: "uri";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly matched_name: {
                                                    readonly type: "string";
                                                };
                                                readonly pep_position: {
                                                    readonly type: "string";
                                                };
                                                readonly date_of_birth: {
                                                    readonly type: "string";
                                                };
                                                readonly other_sources: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly place_of_birth: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                    readonly linked_entities: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly name: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly active: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly status: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly details: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly relation: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                    readonly warning_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly additionalProperties: true;
                                        };
                                    };
                                    readonly sanction_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly additionalProperties: true;
                                        };
                                    };
                                    readonly adverse_media_details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly sentiment: {
                                                readonly type: "string";
                                            };
                                            readonly entity_type: {
                                                readonly type: "string";
                                            };
                                            readonly sentiment_score: {
                                                readonly type: "integer";
                                            };
                                            readonly adverse_keywords: {
                                                readonly type: "object";
                                                readonly additionalProperties: {
                                                    readonly type: "integer";
                                                };
                                            };
                                        };
                                    };
                                    readonly adverse_media_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly country: {
                                                    readonly type: "string";
                                                };
                                                readonly summary: {
                                                    readonly type: "string";
                                                };
                                                readonly headline: {
                                                    readonly type: "string";
                                                };
                                                readonly sentiment: {
                                                    readonly type: "string";
                                                };
                                                readonly thumbnail: {
                                                    readonly type: "string";
                                                    readonly format: "uri";
                                                };
                                                readonly source_url: {
                                                    readonly type: "string";
                                                    readonly format: "uri";
                                                };
                                                readonly author_name: {
                                                    readonly type: "string";
                                                };
                                                readonly other_sources: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly adverse_keywords: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly sentiment_score: {
                                                    readonly type: "integer";
                                                };
                                                readonly publication_date: {
                                                    readonly type: "string";
                                                    readonly format: "date-time";
                                                };
                                            };
                                        };
                                    };
                                    readonly additional_information: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                };
                            };
                        };
                        readonly score: {
                            readonly type: "integer";
                            readonly description: "Overall AML screening score";
                        };
                        readonly screened_data: {
                            readonly type: "object";
                            readonly properties: {
                                readonly full_name: {
                                    readonly type: "string";
                                };
                                readonly nationality: {
                                    readonly type: "string";
                                };
                                readonly date_of_birth: {
                                    readonly type: "string";
                                    readonly format: "date";
                                };
                                readonly document_number: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly ip_analysis: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the IP analysis";
                        };
                        readonly device_brand: {
                            readonly type: "string";
                            readonly description: "Brand of the device used";
                        };
                        readonly device_model: {
                            readonly type: "string";
                            readonly description: "Model of the device used";
                        };
                        readonly browser_family: {
                            readonly type: "string";
                            readonly description: "Browser family used";
                        };
                        readonly os_family: {
                            readonly type: "string";
                            readonly description: "Operating system family";
                        };
                        readonly platform: {
                            readonly type: "string";
                            readonly description: "Platform type (mobile, desktop, etc)";
                        };
                        readonly ip_country: {
                            readonly type: "string";
                            readonly description: "Country detected from IP";
                        };
                        readonly ip_country_code: {
                            readonly type: "string";
                            readonly description: "Two-letter country code from IP";
                        };
                        readonly ip_state: {
                            readonly type: "string";
                            readonly description: "State/region detected from IP";
                        };
                        readonly ip_city: {
                            readonly type: "string";
                            readonly description: "City detected from IP";
                        };
                        readonly latitude: {
                            readonly type: "number";
                            readonly description: "Latitude coordinate of IP location";
                        };
                        readonly longitude: {
                            readonly type: "number";
                            readonly description: "Longitude coordinate of IP location";
                        };
                        readonly ip_address: {
                            readonly type: "string";
                            readonly description: "IP address";
                        };
                        readonly isp: {
                            readonly type: "string";
                            readonly description: "Internet Service Provider";
                        };
                        readonly organization: {
                            readonly type: "string";
                            readonly description: "Organization associated with IP";
                        };
                        readonly is_vpn_or_tor: {
                            readonly type: "boolean";
                            readonly description: "Whether IP is from VPN or Tor network";
                        };
                        readonly is_data_center: {
                            readonly type: "boolean";
                            readonly description: "Whether IP is from a data center";
                        };
                        readonly time_zone: {
                            readonly type: "string";
                            readonly description: "Time zone detected from IP";
                        };
                        readonly time_zone_offset: {
                            readonly type: "string";
                            readonly description: "Time zone offset";
                        };
                        readonly locations_info: {
                            readonly type: "object";
                            readonly properties: {
                                readonly ip: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly location: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly latitude: {
                                                    readonly type: "number";
                                                };
                                                readonly longitude: {
                                                    readonly type: "number";
                                                };
                                            };
                                        };
                                        readonly distance_from_id_document: {
                                            readonly type: "number";
                                        };
                                        readonly distance_from_poa_document: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                                readonly id_document: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly location: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly latitude: {
                                                    readonly type: "number";
                                                };
                                                readonly longitude: {
                                                    readonly type: "number";
                                                };
                                            };
                                        };
                                        readonly distance_from_ip: {
                                            readonly type: "number";
                                        };
                                        readonly distance_from_poa_document: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                                readonly poa_document: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly location: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly latitude: {
                                                    readonly type: "number";
                                                };
                                                readonly longitude: {
                                                    readonly type: "number";
                                                };
                                            };
                                        };
                                        readonly distance_from_ip: {
                                            readonly type: "number";
                                        };
                                        readonly distance_from_id_document: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly database_validation: {
                    readonly type: "object";
                    readonly properties: {
                        readonly issuing_state: {
                            readonly type: "string";
                            readonly description: "The country code of the issuing state.";
                        };
                        readonly validation_type: {
                            readonly type: "string";
                            readonly description: "The type of database validation performed.";
                        };
                        readonly screened_data: {
                            readonly type: "object";
                            readonly description: "The data screened during database validation.";
                            readonly properties: {
                                readonly last_name: {
                                    readonly type: "string";
                                };
                                readonly first_name: {
                                    readonly type: "string";
                                };
                                readonly tax_number: {
                                    readonly type: "string";
                                };
                                readonly date_of_birth: {
                                    readonly type: "string";
                                    readonly format: "date";
                                };
                                readonly document_type: {
                                    readonly type: "string";
                                };
                                readonly expiration_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                };
                            };
                        };
                        readonly validations: {
                            readonly type: "object";
                            readonly description: "The results of the field validations.";
                            readonly properties: {
                                readonly full_name: {
                                    readonly type: "string";
                                };
                                readonly date_of_birth: {
                                    readonly type: "string";
                                };
                                readonly identification_number: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly match_type: {
                            readonly type: "string";
                            readonly description: "The type of match found during validation.";
                        };
                        readonly status: {
                            readonly type: "string";
                            readonly description: "The status of the database validation.";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                            readonly description: "Warnings related to the database validation.";
                        };
                    };
                };
                readonly reviews: {
                    readonly type: "array";
                    readonly items: {
                        readonly type: "object";
                        readonly properties: {
                            readonly user: {
                                readonly type: "string";
                                readonly format: "email";
                            };
                            readonly new_status: {
                                readonly type: "string";
                            };
                            readonly comment: {
                                readonly type: "string";
                            };
                            readonly created_at: {
                                readonly type: "string";
                                readonly format: "date-time";
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PatchV1SessionSessionIdUpdateStatus: {
    readonly body: {
        readonly properties: {
            readonly new_status: {
                readonly type: "string";
                readonly description: "The new status to set for the session. Can be `Approved` or `Declined`.";
                readonly enum: readonly ["Approved", "Declined"];
                readonly "x-readme-id": "0.0";
            };
            readonly comment: {
                readonly type: "string";
                readonly description: "A comment explaining the reason for the status change. For example `Duplicated user`.";
                readonly "x-readme-id": "0.1";
            };
        };
        readonly type: "object";
        readonly required: readonly ["new_status"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sessionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["sessionId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV1SessionSessionIdShare: {
    readonly body: {
        readonly properties: {
            readonly for_application_id: {
                readonly type: "string";
                readonly description: "The application ID to share the session with. You can find this in the settings of your application in the Business Console.";
            };
            readonly ttl_in_seconds: {
                readonly type: "integer";
                readonly description: "The time to live for the share token in seconds. Minimum 60 seconds, maximum 86400 seconds (24 hours).";
                readonly default: "3600";
            };
        };
        readonly type: "object";
        readonly required: readonly ["for_application_id"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly sessionId: {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                };
            };
            readonly required: readonly ["sessionId"];
        }, {
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV1SessionimportShared: {
    readonly body: {
        readonly properties: {
            readonly share_token: {
                readonly type: "string";
                readonly description: "The share token to import the session with.";
            };
            readonly trust_review: {
                readonly type: "boolean";
                readonly description: "Whether to trust the review of the session to be imported. If true, the session will be imported as is, otherwise the session will be set to 'In Review' so it can be reviewed by the application.";
            };
            readonly workflow_id: {
                readonly type: "string";
                readonly description: "The workflow ID to import the session with.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "Sets your own user vendor_data for the imported verification session.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["share_token", "trust_review", "workflow_id"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2AgeEstimation: {
    readonly body: {
        readonly properties: {
            readonly user_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "User's face image to be age estimated. Allowed formats: JPEG, PNG, WebP, TIFF. Maximum file size: 5MB.";
            };
            readonly face_liveness_score_decline_threshold: {
                readonly type: "integer";
                readonly default: 30;
                readonly description: "Results with face liveness score below this will be declined. Must be between 0-100.";
                readonly minimum: 0;
                readonly maximum: 100;
            };
            readonly age_estimation_decline_threshold: {
                readonly type: "integer";
                readonly default: 18;
                readonly description: "Results with age estimation below this will be declined. Must be between 0-100.";
                readonly minimum: 0;
                readonly maximum: 100;
            };
            readonly rotate_image: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "If true, attempts to rotate the input images in 90-degree increments (0, 90, 180, 270) to ensure the detected face is upright before performing the face match. **Note**: This is only recommended if you are unsure about the orientation of the face.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["user_image"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly age_estimation: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["Approved"];
                        };
                        readonly method: {
                            readonly type: "string";
                            readonly examples: readonly ["PASSIVE"];
                        };
                        readonly score: {
                            readonly type: "number";
                            readonly examples: readonly [97.5];
                        };
                        readonly user_image: {
                            readonly type: "object";
                            readonly properties: {
                                readonly entities: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly age: {
                                                readonly type: "number";
                                                readonly examples: readonly [27.33];
                                            };
                                            readonly bbox: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "integer";
                                                };
                                                readonly examples: readonly [40, 40, 100, 100];
                                            };
                                            readonly confidence: {
                                                readonly type: "number";
                                                readonly examples: readonly [0.717775046825409];
                                            };
                                            readonly gender: {
                                                readonly type: "string";
                                                readonly examples: readonly ["male"];
                                            };
                                        };
                                    };
                                };
                                readonly best_angle: {
                                    readonly type: "integer";
                                    readonly examples: readonly [0];
                                };
                            };
                        };
                        readonly age_estimation: {
                            readonly type: "number";
                            readonly examples: readonly [27.33];
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2Aml: {
    readonly body: {
        readonly properties: {
            readonly full_name: {
                readonly type: "string";
                readonly description: "Full name of the person to be screened.";
            };
            readonly date_of_birth: {
                readonly type: "string";
                readonly format: "date";
                readonly description: "Date of birth of the person to be screened with format: YYYY-MM-DD. For example, `1990-05-15`.";
            };
            readonly nationality: {
                readonly type: "string";
                readonly description: "Nationality of the person to be screened with format ISO 3166-1 alpha-2. For example: `ES`.";
            };
            readonly document_number: {
                readonly type: "string";
                readonly description: "Document number of the person to be screened.";
            };
            readonly aml_score_approve_threshold: {
                readonly type: "integer";
                readonly default: 80;
                readonly description: "Results with aml score score above this will be declined. Must be between 0-100.";
                readonly minimum: 0;
                readonly maximum: 100;
            };
            readonly include_adverse_media: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Wheter to include adverse media in the screening. If included, the request will take approximately 10 seconds.";
            };
            readonly include_ongoing_monitoring: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether to include ongoing monitoring in the screening. If included, the save_api_request must be included as well, otherwise it will raise an error.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["full_name"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly aml: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["In Review"];
                        };
                        readonly total_hits: {
                            readonly type: "integer";
                            readonly examples: readonly [1];
                        };
                        readonly hits: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly id: {
                                        readonly type: "string";
                                        readonly examples: readonly ["cPtTGRKkyddAcAC4xgsLCm"];
                                    };
                                    readonly url: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://www.wikidata.org/wiki/Q126539671"];
                                    };
                                    readonly match: {
                                        readonly type: "boolean";
                                        readonly examples: readonly [false];
                                    };
                                    readonly score: {
                                        readonly type: "integer";
                                        readonly examples: readonly [1];
                                    };
                                    readonly target: {
                                        readonly type: "string";
                                    };
                                    readonly caption: {
                                        readonly type: "string";
                                        readonly examples: readonly ["David Sánchez Pérez-Castejón"];
                                    };
                                    readonly datasets: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                        readonly examples: readonly ["PEP"];
                                    };
                                    readonly features: {
                                        readonly type: "string";
                                    };
                                    readonly rca_name: {
                                        readonly type: "string";
                                        readonly examples: readonly [""];
                                    };
                                    readonly last_seen: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly examples: readonly ["2025-06-13T00:00:00"];
                                    };
                                    readonly risk_view: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly crimes: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [0];
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [20];
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                        readonly examples: readonly ["Low"];
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly additionalProperties: true;
                                                    };
                                                };
                                            };
                                            readonly countries: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [0];
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [30];
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                        readonly examples: readonly ["Low"];
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly additionalProperties: true;
                                                    };
                                                };
                                            };
                                            readonly categories: {
                                                readonly type: "object";
                                                readonly properties: {
                                                    readonly score: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [100];
                                                    };
                                                    readonly weightage: {
                                                        readonly type: "integer";
                                                        readonly examples: readonly [50];
                                                    };
                                                    readonly risk_level: {
                                                        readonly type: "string";
                                                        readonly examples: readonly ["High"];
                                                    };
                                                    readonly risk_scores: {
                                                        readonly type: "object";
                                                        readonly properties: {
                                                            readonly PEP: {
                                                                readonly type: "integer";
                                                                readonly examples: readonly [100];
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                            readonly custom_list: {
                                                readonly type: "object";
                                                readonly additionalProperties: true;
                                            };
                                        };
                                    };
                                    readonly first_seen: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly examples: readonly ["2025-01-18T00:00:00"];
                                    };
                                    readonly properties: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly name: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["David Sánchez Pérez-Castejón"];
                                            };
                                            readonly alias: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["David Sánchez Pérez-Castejón", "David Azagra"];
                                            };
                                            readonly notes: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["Spanish orchestra conductor"];
                                            };
                                            readonly title: {
                                                readonly type: "string";
                                            };
                                            readonly gender: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["male"];
                                            };
                                            readonly height: {
                                                readonly type: "string";
                                            };
                                            readonly topics: {
                                                readonly type: "string";
                                            };
                                            readonly weight: {
                                                readonly type: "string";
                                            };
                                            readonly address: {
                                                readonly type: "string";
                                            };
                                            readonly country: {
                                                readonly type: "string";
                                            };
                                            readonly website: {
                                                readonly type: "string";
                                            };
                                            readonly eyeColor: {
                                                readonly type: "string";
                                            };
                                            readonly keywords: {
                                                readonly type: "string";
                                            };
                                            readonly lastName: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["Sánchez", "Pérez-Castejón"];
                                            };
                                            readonly position: {
                                                readonly type: "string";
                                            };
                                            readonly religion: {
                                                readonly type: "string";
                                            };
                                            readonly birthDate: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["1974"];
                                            };
                                            readonly education: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["Tokyo Arts and Space (2012-2012)", "Saint Petersburg Conservatory (-2010)", "Comillas Pontifical University"];
                                            };
                                            readonly ethnicity: {
                                                readonly type: "string";
                                            };
                                            readonly firstName: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["David"];
                                            };
                                            readonly hairColor: {
                                                readonly type: "string";
                                            };
                                            readonly weakAlias: {
                                                readonly type: "string";
                                            };
                                            readonly birthPlace: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "string";
                                                };
                                                readonly examples: readonly ["Madrid"];
                                            };
                                            readonly modifiedAt: {
                                                readonly type: "string";
                                            };
                                            readonly wikidataId: {
                                                readonly type: "string";
                                            };
                                            readonly citizenship: {
                                                readonly type: "string";
                                            };
                                            readonly nationality: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly match_score: {
                                        readonly type: "integer";
                                        readonly examples: readonly [98];
                                    };
                                    readonly pep_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly aliases: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly education: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly list_name: {
                                                    readonly type: "string";
                                                };
                                                readonly publisher: {
                                                    readonly type: "string";
                                                };
                                                readonly source_url: {
                                                    readonly type: "string";
                                                };
                                                readonly description: {
                                                    readonly type: "string";
                                                };
                                                readonly matched_name: {
                                                    readonly type: "string";
                                                };
                                                readonly pep_position: {
                                                    readonly type: "string";
                                                };
                                                readonly date_of_birth: {
                                                    readonly type: "string";
                                                };
                                                readonly other_sources: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly place_of_birth: {
                                                    readonly type: "string";
                                                };
                                            };
                                        };
                                    };
                                    readonly linked_entities: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly name: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly active: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly status: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly details: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly relation: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                            };
                                        };
                                    };
                                    readonly warning_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly additionalProperties: true;
                                        };
                                    };
                                    readonly sanction_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly additionalProperties: true;
                                        };
                                    };
                                    readonly adverse_media_details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly sentiment: {
                                                readonly type: "string";
                                            };
                                            readonly entity_type: {
                                                readonly type: "string";
                                            };
                                            readonly sentiment_score: {
                                                readonly type: "integer";
                                            };
                                            readonly adverse_keywords: {
                                                readonly type: "object";
                                                readonly additionalProperties: {
                                                    readonly type: "integer";
                                                };
                                            };
                                        };
                                    };
                                    readonly adverse_media_matches: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly country: {
                                                    readonly type: "string";
                                                };
                                                readonly summary: {
                                                    readonly type: "string";
                                                };
                                                readonly headline: {
                                                    readonly type: "string";
                                                };
                                                readonly sentiment: {
                                                    readonly type: "string";
                                                };
                                                readonly thumbnail: {
                                                    readonly type: "string";
                                                };
                                                readonly source_url: {
                                                    readonly type: "string";
                                                };
                                                readonly author_name: {
                                                    readonly type: "string";
                                                };
                                                readonly other_sources: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly adverse_keywords: {
                                                    readonly type: "array";
                                                    readonly items: {
                                                        readonly type: "string";
                                                    };
                                                };
                                                readonly sentiment_score: {
                                                    readonly type: "integer";
                                                };
                                                readonly publication_date: {
                                                    readonly type: "string";
                                                    readonly format: "date-time";
                                                };
                                            };
                                        };
                                    };
                                    readonly additional_information: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                };
                            };
                        };
                        readonly score: {
                            readonly type: "integer";
                            readonly examples: readonly [80];
                        };
                        readonly screened_data: {
                            readonly type: "object";
                            readonly properties: {
                                readonly full_name: {
                                    readonly type: "string";
                                    readonly examples: readonly ["David Sánchez Pérez-Castejón"];
                                };
                                readonly nationality: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ES"];
                                };
                                readonly date_of_birth: {
                                    readonly type: "string";
                                    readonly format: "date";
                                    readonly examples: readonly ["1974-01-01"];
                                };
                                readonly document_number: {
                                    readonly type: "string";
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                        readonly examples: readonly ["POSSIBLE_MATCH_FOUND"];
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                        readonly examples: readonly ["warning"];
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["Possible match found in AML screening"];
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["The Anti-Money Laundering (AML) screening process identified potential matches with watchlists or high-risk databases, requiring further review."];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2DatabaseValidation: {
    readonly body: {
        readonly properties: {
            readonly issuing_state: {
                readonly type: "string";
                readonly enum: readonly ["BRA", "DOM", "ECU", "PER"];
                readonly description: "The ISO 3166-1 alpha-3 country code of the issuing state. Determines which validation sources are used.";
            };
            readonly validation_type: {
                readonly type: "string";
                readonly enum: readonly ["one_by_one", "two_by_two"];
                readonly default: "one_by_one";
                readonly description: "The type of matching to perform: '1x1' for single-database matching or '2x2' for dual-database matching.";
            };
            readonly first_name: {
                readonly type: "string";
                readonly description: "The individual's first name. Might be required for some countries and matching types.";
            };
            readonly last_name: {
                readonly type: "string";
                readonly description: "The individual's last name. Might be required for some countries and matching types.";
            };
            readonly date_of_birth: {
                readonly type: "string";
                readonly description: "The individual's date of birth in YYYY-m-d format. Might be required for some countries and matching types. Example: 1990-01-01.";
            };
            readonly personal_number: {
                readonly type: "string";
                readonly description: "A government-issued unique personal identifier (e.g., national ID number). Might be required for some countries and matching types.";
            };
            readonly tax_number: {
                readonly type: "string";
                readonly description: "The individual's tax identification number, where applicable.";
            };
            readonly document_number: {
                readonly type: "string";
                readonly description: "The number of an official document such as a passport or national ID. Might be required for some countries and matching types.";
            };
            readonly nationality: {
                readonly type: "string";
                readonly description: "The individual's nationality, expressed as an ISO 3166-1 alpha-3 country code. Might be required for some countries and matching types.";
            };
            readonly address: {
                readonly type: "string";
                readonly description: "The individual's residential address. Used in specific jurisdictions where address validation is supported. Might be required for some countries and matching types.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["issuing_state", "validation_type"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2EmailCheck: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly description: "The email address to verify. e.g. test@example.com";
            };
            readonly code: {
                readonly type: "string";
                readonly minLength: 4;
                readonly maxLength: 8;
                readonly description: "The verification code sent to the email address. Must be between 4 and 8 characters in length.";
            };
            readonly duplicated_email_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for duplicated email addresses";
            };
            readonly breached_email_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for breached email addresses";
            };
            readonly disposable_email_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for disposable email addresses";
            };
            readonly undeliverable_email_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for undeliverable email addresses";
            };
        };
        readonly required: readonly ["email", "code"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application.";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the session/request.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly description: "Status of the check operation (e.g., 'Approved', 'Failed', 'Expired or Not Found').";
                };
                readonly message: {
                    readonly type: "string";
                    readonly description: "A human-readable message about the check outcome.";
                };
                readonly email: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Status of the email verification";
                        };
                        readonly email: {
                            readonly type: "string";
                            readonly description: "The email address being verified";
                        };
                        readonly is_breached: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email was found in known data breaches";
                        };
                        readonly breaches: {
                            readonly type: "array";
                            readonly description: "List of known breaches this email was found in";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly name: {
                                        readonly type: "string";
                                    };
                                    readonly domain: {
                                        readonly type: "string";
                                    };
                                    readonly logo_path: {
                                        readonly type: "string";
                                    };
                                    readonly breach_date: {
                                        readonly type: "string";
                                        readonly format: "date";
                                    };
                                    readonly description: {
                                        readonly type: "string";
                                    };
                                    readonly is_verified: {
                                        readonly type: "boolean";
                                    };
                                    readonly data_classes: {
                                        readonly type: "array";
                                        readonly items: {
                                            readonly type: "string";
                                        };
                                    };
                                    readonly breach_emails_count: {
                                        readonly type: "integer";
                                    };
                                };
                            };
                        };
                        readonly is_disposable: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email is from a disposable provider";
                        };
                        readonly is_undeliverable: {
                            readonly type: "boolean";
                            readonly description: "Indicates if the email address is undeliverable";
                        };
                        readonly verification_attempts: {
                            readonly type: "integer";
                            readonly description: "Number of verification attempts for this email";
                        };
                        readonly verified_at: {
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly description: "Timestamp when the email was verified";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly description: "List of warnings related to email verification";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                        readonly lifecycle: {
                            readonly type: "array";
                            readonly description: "Chronological list of events in the email verification lifecycle.";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly timestamp: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                    };
                                    readonly details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly status: {
                                                readonly type: "string";
                                            };
                                            readonly reason: {
                                                readonly type: "string";
                                            };
                                            readonly code_tried: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly fee: {
                                        readonly type: "number";
                                    };
                                };
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "Timestamp when the email verification session was created.";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2EmailSend: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly email: {
                readonly type: "string";
                readonly description: "The email address to verify. e.g. test@example.com";
            };
            readonly options: {
                readonly type: "object";
                readonly description: "Options for the email verification, such as code_size and locale.";
                readonly properties: {
                    readonly code_size: {
                        readonly type: "integer";
                        readonly minimum: 4;
                        readonly maximum: 8;
                        readonly default: 6;
                        readonly description: "The number of digits for the verification code. Minimum 4, maximum 8.";
                    };
                    readonly locale: {
                        readonly type: "string";
                        readonly maxLength: 5;
                        readonly description: "The locale to use for the verification message. e.g. en-US";
                    };
                };
            };
            readonly signals: {
                readonly type: "object";
                readonly description: "A dictionary of signals for fraud detection. Keys are signal names (string) and values are signal values (string).";
                readonly properties: {
                    readonly ip: {
                        readonly type: "string";
                        readonly format: "ipv4";
                        readonly description: "The IP address of the user's device. Supports both IPv4 and IPv6. Example: '192.0.2.1' or '2001:0db8:85a3:0000:0000:8a2e:0370:7334'.";
                    };
                    readonly device_id: {
                        readonly type: "string";
                        readonly maxLength: 255;
                        readonly description: "The unique identifier for the user's device. For Android, this is ANDROID_ID; for iOS, identifierForVendor. Example: '8F0B8FDD-C2CB-4387-B20A-56E9B2E5A0D2'.";
                    };
                    readonly user_agent: {
                        readonly type: "string";
                        readonly maxLength: 512;
                        readonly description: "The user agent of the user's device. Example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'.";
                    };
                };
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly required: readonly ["email"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application.";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the session/request.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["Success", "Retry", "Undeliverable"];
                    readonly description: "Status of the send operation (e.g., 'Success', 'Retry', 'Undeliverable').\n\n`Success` `Retry` `Undeliverable`";
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "Reason for the status (only applies to 'Undeliverable').";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2FaceMatch: {
    readonly body: {
        readonly properties: {
            readonly user_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "User's face image to be verified. Allowed formats: JPEG, PNG, WebP, TIFF. Maximum file size: 5MB.";
            };
            readonly ref_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "Reference image to compare against. Allowed formats: JPEG, PNG, WebP, TIFF. Maximum file size: 5MB.";
            };
            readonly face_match_score_decline_threshold: {
                readonly type: "integer";
                readonly default: 30;
                readonly description: "Results with face match score below this will be declined. Must be between 0-100.";
                readonly minimum: 0;
                readonly maximum: 100;
            };
            readonly rotate_image: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "If true, attempts to rotate the input images in 90-degree increments (0, 90, 180, 270) to ensure the detected face is upright before performing the face match. **Note**: This is only recommended if you are unsure about the orientation of the face.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["user_image", "ref_image"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly face_match: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["Approved"];
                        };
                        readonly score: {
                            readonly type: "integer";
                            readonly examples: readonly [80];
                        };
                        readonly user_image: {
                            readonly type: "object";
                            readonly properties: {
                                readonly entities: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly age: {
                                                readonly type: "number";
                                                readonly examples: readonly [27.63];
                                            };
                                            readonly bbox: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "integer";
                                                };
                                                readonly examples: readonly [40, 40, 100, 100];
                                            };
                                            readonly confidence: {
                                                readonly type: "number";
                                                readonly examples: readonly [0.717775046825409];
                                            };
                                            readonly gender: {
                                                readonly type: "string";
                                                readonly examples: readonly ["male"];
                                            };
                                        };
                                    };
                                };
                                readonly best_angle: {
                                    readonly type: "integer";
                                    readonly examples: readonly [0];
                                };
                            };
                        };
                        readonly ref_image: {
                            readonly type: "object";
                            readonly properties: {
                                readonly entities: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly age: {
                                                readonly type: "number";
                                                readonly examples: readonly [22.16];
                                            };
                                            readonly bbox: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "integer";
                                                };
                                                readonly examples: readonly [156, 234, 679, 898];
                                            };
                                            readonly confidence: {
                                                readonly type: "number";
                                                readonly examples: readonly [0.717775046825409];
                                            };
                                            readonly gender: {
                                                readonly type: "string";
                                                readonly examples: readonly ["male"];
                                            };
                                        };
                                    };
                                };
                                readonly best_angle: {
                                    readonly type: "integer";
                                    readonly examples: readonly [0];
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2FaceSearch: {
    readonly body: {
        readonly properties: {
            readonly user_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "User's face image to be searched for similarities in previous approved sessions. Allowed formats: JPEG, PNG, WebP, TIFF. Maximum file size: 5MB.";
            };
            readonly search_type: {
                readonly type: "string";
                readonly default: "most_similar";
                readonly description: "Search type for face search. Must be between `most_similar` or `blocklisted_or_approved`.";
                readonly enum: readonly ["most_similar", "blocklisted_or_approved"];
            };
            readonly rotate_image: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "If true, attempts to rotate the input images in 90-degree increments (0, 90, 180, 270) to ensure the detected face is upright before performing the face match. **Note**: This is only recommended if you are unsure about the orientation of the face.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["user_image"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly face_search: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["Declined"];
                        };
                        readonly total_matches: {
                            readonly type: "integer";
                            readonly examples: readonly [1];
                        };
                        readonly matches: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly session_id: {
                                        readonly type: "string";
                                        readonly format: "uuid";
                                        readonly examples: readonly ["882c42d5-8a4d-4d20-8080-a22f57822c86"];
                                    };
                                    readonly session_number: {
                                        readonly type: "integer";
                                        readonly examples: readonly [323442];
                                    };
                                    readonly similarity_percentage: {
                                        readonly type: "integer";
                                        readonly examples: readonly [100];
                                    };
                                    readonly vendor_data: {
                                        readonly type: "string";
                                        readonly examples: readonly ["user-1"];
                                    };
                                    readonly verification_date: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                        readonly examples: readonly ["2025-01-01T00:00:00Z"];
                                    };
                                    readonly user_details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly full_name: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Alejandro Rosás"];
                                            };
                                            readonly document_type: {
                                                readonly type: "string";
                                                readonly examples: readonly ["ID"];
                                            };
                                            readonly document_number: {
                                                readonly type: "string";
                                                readonly examples: readonly ["CA00000000"];
                                            };
                                        };
                                    };
                                    readonly match_image_url: {
                                        readonly type: "string";
                                        readonly examples: readonly ["https://example.com/image.jpg"];
                                    };
                                    readonly status: {
                                        readonly type: "string";
                                        readonly examples: readonly ["Declined"];
                                    };
                                    readonly is_blocklisted: {
                                        readonly type: "boolean";
                                        readonly examples: readonly [true];
                                    };
                                };
                            };
                        };
                        readonly user_image: {
                            readonly type: "object";
                            readonly properties: {
                                readonly entities: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly bbox: {
                                                readonly type: "array";
                                                readonly items: {
                                                    readonly type: "integer";
                                                };
                                                readonly examples: readonly [40, 40, 120, 120];
                                            };
                                            readonly confidence: {
                                                readonly type: "number";
                                                readonly examples: readonly [0.717775046825409];
                                            };
                                        };
                                    };
                                };
                                readonly best_angle: {
                                    readonly type: "integer";
                                    readonly examples: readonly [0];
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                        readonly examples: readonly ["FACE_IN_BLOCKLIST"];
                                    };
                                    readonly additional_data: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly blocklisted_session_id: {
                                                readonly type: "string";
                                                readonly format: "uuid";
                                                readonly examples: readonly ["882c42d5-8a4d-4d20-8080-a22f57822c86"];
                                            };
                                            readonly blocklisted_session_number: {
                                                readonly type: "integer";
                                                readonly examples: readonly [323442];
                                            };
                                        };
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                        readonly examples: readonly ["error"];
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["Face in blocklist"];
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["The system identified a face in the blocklist, which means the face is not allowed to be verified."];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2IdVerification: {
    readonly body: {
        readonly properties: {
            readonly front_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "Front side image of the identity document. Allowed formats: JPEG, PNG, WebP, TIFF, PDF. Maximum file size: 5MB.";
            };
            readonly back_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "Back side image of the identity document, required for dual-sided documents like ID cards. Allowed formats: JPEG, PNG, WebP, TIFF, PDF. Maximum file size: 5MB.";
            };
            readonly perform_document_liveness: {
                readonly type: "boolean";
                readonly default: false;
                readonly description: "Whether or not to perform document liveness to make sure the imaged is not a screened copy, or portrait replacement.";
            };
            readonly minimum_age: {
                readonly type: "integer";
                readonly description: "Minimum age required. Users under this age will be declined. Must be between 1-120.";
                readonly minimum: 1;
                readonly maximum: 120;
            };
            readonly expiration_date_not_detected_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when the expiration date is not detected. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly invalid_mrz_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when MRZ reading fails because the MRZ has been tampered, or there is some occlusions that does not allow to read it properly. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly inconsistent_data_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when the extracted data in the VIZ (Visual Inspection Zone) is not consistent with the MRZ data, indicating signs of data tampering. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["front_image"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                };
                readonly id_verification: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly examples: readonly ["Declined"];
                        };
                        readonly issuing_state: {
                            readonly type: "string";
                            readonly examples: readonly ["ESP"];
                        };
                        readonly issuing_state_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Spain"];
                        };
                        readonly region: {
                            readonly type: "string";
                            readonly examples: readonly ["Community of Madrid"];
                        };
                        readonly document_type: {
                            readonly type: "string";
                            readonly examples: readonly ["ID Card"];
                        };
                        readonly document_number: {
                            readonly type: "string";
                            readonly examples: readonly ["YZA123456"];
                        };
                        readonly personal_number: {
                            readonly type: "string";
                            readonly examples: readonly ["X9876543L"];
                        };
                        readonly date_of_birth: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly examples: readonly ["1985-03-15"];
                        };
                        readonly age: {
                            readonly type: "integer";
                            readonly examples: readonly [40];
                        };
                        readonly expiration_date: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly examples: readonly ["2022-08-21"];
                        };
                        readonly date_of_issue: {
                            readonly type: "string";
                            readonly format: "date";
                            readonly examples: readonly ["2012-08-21"];
                        };
                        readonly first_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Elena"];
                        };
                        readonly last_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Martínez Sánchez"];
                        };
                        readonly full_name: {
                            readonly type: "string";
                            readonly examples: readonly ["Elena Martínez Sánchez"];
                        };
                        readonly gender: {
                            readonly type: "string";
                            readonly examples: readonly ["F"];
                        };
                        readonly address: {
                            readonly type: "string";
                            readonly examples: readonly ["Calle Mayor 10, 4B, Madrid, Madrid"];
                        };
                        readonly formatted_address: {
                            readonly type: "string";
                            readonly examples: readonly ["Calle Mayor 10, 4B, 28013 Madrid, Madrid, Spain"];
                        };
                        readonly place_of_birth: {
                            readonly type: "string";
                            readonly examples: readonly ["Valencia"];
                        };
                        readonly marital_status: {
                            readonly type: "string";
                            readonly examples: readonly ["Single"];
                        };
                        readonly nationality: {
                            readonly type: "string";
                            readonly examples: readonly ["ESP"];
                        };
                        readonly extra_fields: {
                            readonly type: "object";
                            readonly properties: {
                                readonly dl_categories: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly blood_group: {
                                    readonly type: "string";
                                    readonly description: "Blood group";
                                };
                            };
                        };
                        readonly parsed_address: {
                            readonly type: "object";
                            readonly properties: {
                                readonly id: {
                                    readonly type: "string";
                                    readonly format: "uuid";
                                    readonly examples: readonly ["8b7190b3-ec7b-4369-a4e6-3bd098dcd7ef"];
                                };
                                readonly address_type: {
                                    readonly type: "string";
                                    readonly examples: readonly ["Calle"];
                                };
                                readonly city: {
                                    readonly type: "string";
                                    readonly examples: readonly ["Madrid"];
                                };
                                readonly label: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ID Card Address"];
                                };
                                readonly region: {
                                    readonly type: "string";
                                    readonly examples: readonly ["Community of Madrid"];
                                };
                                readonly street_1: {
                                    readonly type: "string";
                                    readonly examples: readonly ["Calle Mayor 10"];
                                };
                                readonly street_2: {
                                    readonly type: "string";
                                    readonly examples: readonly ["4B"];
                                };
                                readonly postal_code: {
                                    readonly type: "string";
                                    readonly examples: readonly ["28013"];
                                };
                                readonly raw_results: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly geometry: {
                                            readonly type: "object";
                                            readonly properties: {
                                                readonly location: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly lat: {
                                                            readonly type: "number";
                                                            readonly examples: readonly [40.4155];
                                                        };
                                                        readonly lng: {
                                                            readonly type: "number";
                                                            readonly examples: readonly [-3.7074];
                                                        };
                                                    };
                                                };
                                                readonly location_type: {
                                                    readonly type: "string";
                                                    readonly examples: readonly ["ROOFTOP"];
                                                };
                                                readonly viewport: {
                                                    readonly type: "object";
                                                    readonly properties: {
                                                        readonly northeast: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly lat: {
                                                                    readonly type: "number";
                                                                    readonly examples: readonly [40.41685];
                                                                };
                                                                readonly lng: {
                                                                    readonly type: "number";
                                                                    readonly examples: readonly [-3.70605];
                                                                };
                                                            };
                                                        };
                                                        readonly southwest: {
                                                            readonly type: "object";
                                                            readonly properties: {
                                                                readonly lat: {
                                                                    readonly type: "number";
                                                                    readonly examples: readonly [40.41415];
                                                                };
                                                                readonly lng: {
                                                                    readonly type: "number";
                                                                    readonly examples: readonly [-3.70875];
                                                                };
                                                            };
                                                        };
                                                    };
                                                };
                                            };
                                        };
                                    };
                                };
                            };
                        };
                        readonly portrait_image: {
                            readonly type: "string";
                            readonly examples: readonly ["/9j/4AAQSkZJRgA...p5X3Ku+x//9k="];
                        };
                        readonly front_document_image: {
                            readonly type: "string";
                            readonly examples: readonly ["/9j/4AAQSkZJRgA...p5X3Ku+x//9k="];
                        };
                        readonly back_document_image: {
                            readonly type: "string";
                            readonly examples: readonly ["/9j/4AAQSkZJRgA...p5X3Ku+x//9k="];
                        };
                        readonly mrz: {
                            readonly type: "object";
                            readonly properties: {
                                readonly surname: {
                                    readonly type: "string";
                                    readonly examples: readonly ["MARTINEZ<SANCHEZ"];
                                };
                                readonly name: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ELENA"];
                                };
                                readonly country: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ESP"];
                                };
                                readonly nationality: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ESP"];
                                };
                                readonly birth_date: {
                                    readonly type: "string";
                                    readonly examples: readonly ["850315"];
                                };
                                readonly expiry_date: {
                                    readonly type: "string";
                                    readonly examples: readonly ["220821"];
                                };
                                readonly sex: {
                                    readonly type: "string";
                                    readonly examples: readonly ["F"];
                                };
                                readonly document_type: {
                                    readonly type: "string";
                                    readonly examples: readonly ["ID"];
                                };
                                readonly document_number: {
                                    readonly type: "string";
                                    readonly examples: readonly ["YZA123456"];
                                };
                                readonly optional_data: {
                                    readonly type: "string";
                                    readonly examples: readonly ["X9876543L"];
                                };
                                readonly optional_data_2: {
                                    readonly type: "string";
                                    readonly examples: readonly [""];
                                };
                                readonly birth_date_hash: {
                                    readonly type: "string";
                                    readonly examples: readonly ["7"];
                                };
                                readonly expiry_date_hash: {
                                    readonly type: "string";
                                    readonly examples: readonly ["4"];
                                };
                                readonly document_number_hash: {
                                    readonly type: "string";
                                    readonly examples: readonly ["9"];
                                };
                                readonly final_hash: {
                                    readonly type: "string";
                                    readonly examples: readonly ["2"];
                                };
                                readonly personal_number: {
                                    readonly type: "string";
                                    readonly examples: readonly ["X9876543L"];
                                };
                                readonly warnings: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly errors: {
                                    readonly type: "array";
                                    readonly items: {
                                        readonly type: "string";
                                    };
                                };
                                readonly mrz_type: {
                                    readonly type: "string";
                                    readonly examples: readonly ["TD1"];
                                };
                                readonly mrz_string: {
                                    readonly type: "string";
                                    readonly examples: readonly ["IDESPMARTINEZ<SANCHEZ<<<<<<<<<<<\nYZA123456<9ESP8503157F3208214<X9876543L<<<<<<<2\nMARTINEZ<SANCHEZ<<ELENA<<<<<<<<<<"];
                                };
                                readonly mrz_key: {
                                    readonly type: "string";
                                    readonly examples: readonly ["YZA123456985031573208214"];
                                };
                            };
                        };
                        readonly barcodes: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                        readonly examples: readonly ["PDF_417"];
                                    };
                                    readonly data: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly first: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Elena"];
                                            };
                                            readonly last: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Martínez"];
                                            };
                                            readonly middle: {
                                                readonly type: "string";
                                            };
                                            readonly city: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Madrid"];
                                            };
                                            readonly state: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Madrid"];
                                            };
                                            readonly address: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Calle Mayor 10, 4B"];
                                            };
                                            readonly issue_identifier: {
                                                readonly type: "string";
                                                readonly examples: readonly ["636001"];
                                            };
                                            readonly document_number: {
                                                readonly type: "string";
                                                readonly examples: readonly ["YZA123456"];
                                            };
                                            readonly expiration_date: {
                                                readonly type: "string";
                                                readonly examples: readonly ["2022-08-21"];
                                            };
                                            readonly date_of_birth: {
                                                readonly type: "string";
                                                readonly examples: readonly ["1985-03-15"];
                                            };
                                            readonly postal_code: {
                                                readonly type: "string";
                                                readonly examples: readonly ["28013"];
                                            };
                                            readonly class: {
                                                readonly type: "string";
                                            };
                                            readonly restrictions: {
                                                readonly type: "string";
                                            };
                                            readonly endorsements: {
                                                readonly type: "string";
                                            };
                                            readonly sex: {
                                                readonly type: "string";
                                                readonly examples: readonly ["F"];
                                            };
                                            readonly height: {
                                                readonly type: "string";
                                                readonly examples: readonly ["168 cm"];
                                            };
                                            readonly weight: {
                                                readonly type: "string";
                                                readonly examples: readonly ["65 kg"];
                                            };
                                            readonly hair: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Brown"];
                                            };
                                            readonly eyes: {
                                                readonly type: "string";
                                                readonly examples: readonly ["Green"];
                                            };
                                            readonly issued: {
                                                readonly type: "string";
                                                readonly examples: readonly ["2022-08-21"];
                                            };
                                            readonly units: {
                                                readonly type: "string";
                                                readonly examples: readonly ["METRIC"];
                                            };
                                            readonly suffix: {
                                                readonly type: "string";
                                            };
                                            readonly prefix: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly data_raw: {
                                        readonly type: "string";
                                        readonly examples: readonly ["JVBERi0xLjUNCiXi48/TDQoNCjEgMCBvYmo[...]truncated_for_example"];
                                    };
                                    readonly side: {
                                        readonly type: "string";
                                        readonly examples: readonly ["back"];
                                    };
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                        readonly examples: readonly ["DOCUMENT_EXPIRED"];
                                    };
                                    readonly additional_data: {
                                        readonly type: "string";
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                        readonly examples: readonly ["error"];
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["Document expired"];
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                        readonly examples: readonly ["The document's expiration date has passed, rendering it no longer valid for use."];
                                    };
                                };
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2PassiveLiveness: {
    readonly body: {
        readonly properties: {
            readonly user_image: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "User's face image to perform the passive liveness. Allowed formats: JPEG, PNG, WebP, TIFF. Maximum file size: 5MB.";
            };
            readonly face_liveness_score_decline_threshold: {
                readonly type: "integer";
                readonly description: "Results with liveness score below this will be declined. Must be between 0-100.";
            };
            readonly rotate_image: {
                readonly type: "boolean";
                readonly description: "If true, attempts to rotate the input images in 90-degree increments (0, 90, 180, 270) to ensure the detected face is upright before performing the face match. Note: This is only recommended if you are unsure about the orientation of the face.";
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["user_image"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2PhoneCheck: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone_number: {
                readonly type: "string";
                readonly description: "The phone number to verify in E.164 format. e.g. +14155552671";
            };
            readonly code: {
                readonly type: "string";
                readonly minLength: 4;
                readonly maxLength: 8;
                readonly description: "The verification code sent to the phone number. Must be between 4 and 8 characters in length.";
            };
            readonly duplicated_phone_number_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for duplicated phone numbers";
            };
            readonly disposable_number_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for disposable phone numbers";
            };
            readonly voip_number_action: {
                readonly type: "string";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
                readonly default: "NO_ACTION";
                readonly description: "Action to take for VoIP phone numbers";
            };
        };
        readonly required: readonly ["phone_number", "code"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application.";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the session/request.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly description: "Status of the check operation (e.g., 'Approved', 'Failed', 'Expired or Not Found').";
                };
                readonly message: {
                    readonly type: "string";
                    readonly description: "A human-readable message about the check outcome.";
                };
                readonly phone: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                            readonly description: "Overall status of the phone verification process.";
                        };
                        readonly phone_number_prefix: {
                            readonly type: "string";
                            readonly description: "Country calling code prefix.";
                        };
                        readonly phone_number: {
                            readonly type: "string";
                            readonly description: "Phone number without country prefix.";
                        };
                        readonly full_number: {
                            readonly type: "string";
                            readonly description: "Complete phone number with country prefix.";
                        };
                        readonly country_code: {
                            readonly type: "string";
                            readonly description: "Two-letter country code (ISO 3166-1 alpha-2).";
                        };
                        readonly country_name: {
                            readonly type: "string";
                            readonly description: "Full country name.";
                        };
                        readonly carrier: {
                            readonly type: "object";
                            readonly properties: {
                                readonly name: {
                                    readonly type: "string";
                                    readonly description: "Name of the phone carrier.";
                                };
                                readonly type: {
                                    readonly type: "string";
                                    readonly description: "Type of phone line (mobile, landline, etc).";
                                };
                            };
                        };
                        readonly is_disposable: {
                            readonly type: "boolean";
                            readonly description: "Whether the phone number is from a disposable service.";
                        };
                        readonly is_virtual: {
                            readonly type: "boolean";
                            readonly description: "Whether the phone number is virtual.";
                        };
                        readonly verification_method: {
                            readonly type: "string";
                            readonly description: "Method used to verify the phone number.";
                        };
                        readonly verification_attempts: {
                            readonly type: "integer";
                            readonly description: "Number of verification attempts made.";
                        };
                        readonly verified_at: {
                            readonly type: "string";
                            readonly format: "date-time";
                            readonly description: "Timestamp when the phone was verified.";
                        };
                        readonly lifecycle: {
                            readonly type: "array";
                            readonly description: "Chronological list of events in the phone verification lifecycle.";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly type: {
                                        readonly type: "string";
                                    };
                                    readonly timestamp: {
                                        readonly type: "string";
                                        readonly format: "date-time";
                                    };
                                    readonly details: {
                                        readonly type: "object";
                                        readonly properties: {
                                            readonly status: {
                                                readonly type: "string";
                                            };
                                            readonly reason: {
                                                readonly type: "string";
                                            };
                                            readonly is_retry: {
                                                readonly type: "boolean";
                                            };
                                            readonly code_tried: {
                                                readonly type: "string";
                                            };
                                        };
                                    };
                                    readonly fee: {
                                        readonly type: "number";
                                    };
                                };
                            };
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly description: "List of warnings related to phone verification.";
                            readonly items: {
                                readonly type: "object";
                                readonly additionalProperties: true;
                            };
                        };
                    };
                };
                readonly created_at: {
                    readonly type: "string";
                    readonly format: "date-time";
                    readonly description: "Timestamp when the phone verification session was created.";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "404": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2PhoneSend: {
    readonly body: {
        readonly type: "object";
        readonly properties: {
            readonly phone_number: {
                readonly type: "string";
                readonly description: "The phone number to verify in E.164 format. e.g. +14155552671";
            };
            readonly options: {
                readonly type: "object";
                readonly description: "Options for the phone verification, such as code_size, locale, and preferred_channel.";
                readonly properties: {
                    readonly code_size: {
                        readonly type: "integer";
                        readonly minimum: 4;
                        readonly maximum: 8;
                        readonly default: 6;
                        readonly description: "The number of digits for the verification code. Minimum 4, maximum 8.";
                    };
                    readonly locale: {
                        readonly type: "string";
                        readonly maxLength: 5;
                        readonly description: "The locale to use for the verification message. e.g. en-US";
                    };
                    readonly preferred_channel: {
                        readonly type: "string";
                        readonly enum: readonly ["sms", "whatsapp", "telegram", "voice"];
                        readonly default: "whatsapp";
                        readonly description: "Specifies the preferred channel for delivering the verification message (e.g., whatsapp). If the selected channel is unavailable for the country or phone number, the message will automatically be sent via SMS as a fallback.";
                    };
                };
            };
            readonly signals: {
                readonly type: "object";
                readonly description: "A dictionary of signals for fraud detection. Keys are signal names (string) and values are signal values (string).";
                readonly properties: {
                    readonly ip: {
                        readonly type: "string";
                        readonly format: "ipv4";
                        readonly description: "The IP address of the user's device. Supports both IPv4 and IPv6. Example: '192.0.2.1' or '2001:0db8:85a3:0000:0000:8a2e:0370:7334'.";
                    };
                    readonly device_id: {
                        readonly type: "string";
                        readonly maxLength: 255;
                        readonly description: "The unique identifier for the user's device. For Android, this is ANDROID_ID; for iOS, identifierForVendor. Example: '8F0B8FDD-C2CB-4387-B20A-56E9B2E5A0D2'.";
                    };
                    readonly device_platform: {
                        readonly type: "string";
                        readonly enum: readonly ["android", "ios", "ipados", "tvos", "web"];
                        readonly description: "The type of the user's device. One of: android, ios, ipados, tvos, web. Example: 'ios'.";
                    };
                    readonly device_model: {
                        readonly type: "string";
                        readonly maxLength: 255;
                        readonly description: "The model of the user's device. Example: 'iPhone17,2'.";
                    };
                    readonly os_version: {
                        readonly type: "string";
                        readonly maxLength: 64;
                        readonly description: "The version of the user's device operating system. Example: '18.0.1'.";
                    };
                    readonly app_version: {
                        readonly type: "string";
                        readonly maxLength: 64;
                        readonly description: "The version of your application. Example: '1.2.34'.";
                    };
                    readonly user_agent: {
                        readonly type: "string";
                        readonly maxLength: 512;
                        readonly description: "The user agent of the user's device. Example: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Mobile/15E148 Safari/604.1'.";
                    };
                };
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly required: readonly ["phone_number"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application.";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the session/request.";
                };
                readonly status: {
                    readonly type: "string";
                    readonly enum: readonly ["Success", "Undeliverable", "Retry"];
                    readonly description: "Status of the send operation (e.g., 'Success', 'Undeliverable', 'Retry').\n\n`Success` `Undeliverable` `Retry`";
                };
                readonly reason: {
                    readonly type: "string";
                    readonly description: "Reason for the status (only applies to 'Undeliverable').";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "401": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "429": {
            readonly type: "object";
            readonly properties: {
                readonly detail: {
                    readonly type: "string";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2Poa: {
    readonly body: {
        readonly properties: {
            readonly document: {
                readonly type: "string";
                readonly format: "binary";
                readonly description: "Proof of address document. Allowed formats: PDF, JPEG, PNG, WebP, TIFF. Maximum file size: 15MB.";
            };
            readonly expected_address: {
                readonly type: "string";
                readonly description: "Expected address to cross-validate with the data extracted in the POA document.";
            };
            readonly expected_country: {
                readonly type: "string";
                readonly description: "Expected country to cross-validate with the data extracted in the POA document.";
            };
            readonly expected_first_name: {
                readonly type: "string";
                readonly description: "Expected first name to cross-validate with the data extracted in the POA document.";
            };
            readonly expected_last_name: {
                readonly type: "string";
                readonly description: "Expected last name to cross-validate with the data extracted in the POA document.";
            };
            readonly poa_languages_allowed: {
                readonly type: "string";
                readonly description: "Comma-separated list of allowed language codes (e.g., `en,es,fr`). If blank or not provided, defaults are used. You can find a list of supported languages [here](/identity-verification/supported-languages).";
            };
            readonly poa_document_age_months: {
                readonly type: "string";
                readonly default: "utility_bill:3,bank_statement:3,government_issued_document:3";
                readonly description: "Comma-separated key:value pairs for document age limits (e.g., `utility_bill:3,bank_statement:3`). If blank or not provided, defaults are used.";
            };
            readonly poa_name_mismatch_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when there is a mismatch between the name provided (first name, last name, or both), and the extracted name from the POA document. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly poa_document_issues_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when the document quality or file integrity is poor. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly poa_document_authenticity_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when document manipulation or authenticity is suspected. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly poa_unsupported_language_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when the document language is not supported. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly poa_address_mismatch_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when there is a mismatch between the expected address and the address extracted from the POA document. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly poa_issuer_not_identified_action: {
                readonly type: "string";
                readonly default: "DECLINE";
                readonly description: "Action to take when the issuer is not identified. Must be one of `NO_ACTION` or `DECLINE`.";
                readonly enum: readonly ["NO_ACTION", "DECLINE"];
            };
            readonly save_api_request: {
                readonly type: "boolean";
                readonly default: true;
                readonly description: "Whether to save this API request. If true, then it will appear on the `Manual Checks` section in the Business Console.";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
            };
        };
        readonly type: "object";
        readonly required: readonly ["document"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "200": {
            readonly type: "object";
            readonly properties: {
                readonly request_id: {
                    readonly type: "string";
                };
                readonly poa: {
                    readonly type: "object";
                    readonly properties: {
                        readonly status: {
                            readonly type: "string";
                        };
                        readonly issuing_state: {
                            readonly type: "string";
                        };
                        readonly document_type: {
                            readonly type: "string";
                        };
                        readonly document_language: {
                            readonly type: "string";
                        };
                        readonly document_metadata: {
                            readonly type: "object";
                            readonly properties: {
                                readonly file_size: {
                                    readonly type: "integer";
                                    readonly description: "Size of the document";
                                };
                                readonly content_type: {
                                    readonly type: "string";
                                    readonly description: "Content type of the document";
                                };
                                readonly creation_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                    readonly description: "Date when the document was created";
                                };
                                readonly modified_date: {
                                    readonly type: "string";
                                    readonly format: "date";
                                    readonly description: "Date when the document was modified";
                                };
                            };
                        };
                        readonly issuer: {
                            readonly type: "string";
                        };
                        readonly issue_date: {
                            readonly type: "string";
                            readonly format: "date";
                        };
                        readonly poa_address: {
                            readonly type: "string";
                        };
                        readonly poa_formatted_address: {
                            readonly type: "string";
                        };
                        readonly poa_parsed_address: {
                            readonly type: "object";
                            readonly properties: {
                                readonly street_1: {
                                    readonly type: "string";
                                };
                                readonly street_2: {
                                    readonly type: "string";
                                };
                                readonly city: {
                                    readonly type: "string";
                                };
                                readonly region: {
                                    readonly type: "string";
                                };
                                readonly country: {
                                    readonly type: "string";
                                };
                                readonly postal_code: {
                                    readonly type: "string";
                                };
                                readonly document_location: {
                                    readonly type: "object";
                                    readonly properties: {
                                        readonly latitude: {
                                            readonly type: "number";
                                        };
                                        readonly longitude: {
                                            readonly type: "number";
                                        };
                                    };
                                };
                            };
                        };
                        readonly expected_details_address: {
                            readonly type: "string";
                        };
                        readonly expected_details_formatted_address: {
                            readonly type: "string";
                        };
                        readonly expected_details_parsed_address: {
                            readonly type: "object";
                            readonly additionalProperties: true;
                        };
                        readonly name_on_document: {
                            readonly type: "string";
                        };
                        readonly warnings: {
                            readonly type: "array";
                            readonly items: {
                                readonly type: "object";
                                readonly properties: {
                                    readonly risk: {
                                        readonly type: "string";
                                    };
                                    readonly additional_data: {
                                        readonly type: "object";
                                        readonly additionalProperties: true;
                                    };
                                    readonly log_type: {
                                        readonly type: "string";
                                    };
                                    readonly short_description: {
                                        readonly type: "string";
                                    };
                                    readonly long_description: {
                                        readonly type: "string";
                                    };
                                };
                            };
                        };
                        readonly created_at: {
                            readonly type: "string";
                            readonly format: "date-time";
                        };
                    };
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
declare const PostV2Session: {
    readonly body: {
        readonly properties: {
            readonly workflow_id: {
                readonly type: "string";
                readonly description: "The verification workflow to use. You can check how to create a custom workflow and obtain the workflow_id in the [Workflows](/identity-verification/workflows) page.";
                readonly "x-readme-id": "0.0";
            };
            readonly vendor_data: {
                readonly type: "string";
                readonly description: "A unique identifier for the vendor or user, such as a UUID or email. This field enables proper session tracking and user data aggregation across multiple verification sessions.";
                readonly "x-readme-id": "0.1";
            };
            readonly callback: {
                readonly type: "string";
                readonly description: "URL to redirect the user after verification completes. Didit automatically appends `verificationSessionId` and `status` (Approved, Declined, In Review) as query parameters.";
                readonly "x-readme-id": "0.2";
            };
            readonly metadata: {
                readonly type: "string";
                readonly description: "Additional data to store with the session not displayed to the user. For example: `{\"user_type\": \"premium\", \"account_id\": \"ABC123\"}`.";
                readonly "x-readme-id": "0.3";
            };
            readonly language: {
                readonly type: "string";
                readonly description: "Language code (ISO 639-1) for the verification process interface. Controls the language displayed to the end user during verification. If not provided, the browser's language will be automatically detected and used. Check all the supported languages [here](/reference/supported-languages).";
                readonly enum: readonly ["en", "ar", "bg", "ca", "cnr", "cs", "da", "de", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu", "hy", "id", "it", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nl", "no", "pl", "pt-BR", "pt", "ro", "ru", "sk", "sl", "so", "sr", "sv", "th", "tr", "uk", "uz", "vi", "zh-CN", "zh-TW", "zh"];
                readonly "x-readme-id": "0.4";
            };
            readonly contact_details: {
                readonly type: "object";
                readonly description: "User contact information that can be used for notifications, prefilling verification forms, and phone verification. This includes email address, preferred language for communications, and phone number.";
                readonly properties: {
                    readonly email: {
                        readonly type: "string";
                        readonly description: "Email address of the user (e.g., \"john.doe@example.com\") that will be used during the [Email Verification](/identity-verification/email-verification/how-it-works) step. If not provided, the user must provide it during the verification flow.";
                        readonly "x-readme-id": "1.0";
                    };
                    readonly send_notification_emails: {
                        readonly type: "boolean";
                        readonly default: false;
                        readonly description: "If true, sends verification status notifications for sessions requiring manual review to the provided email address (e.g., from 'In Review' to 'Approved' or 'Declined'). This helps users return to your application once their verification is complete. If you have white-label activated for the session, the email sent will be white-labeled.";
                        readonly "x-readme-id": "1.1";
                    };
                    readonly email_lang: {
                        readonly type: "string";
                        readonly default: "en";
                        readonly description: "Language code (ISO 639-1) for email notifications. Controls the language of all email communications (e.g., \"en\", \"es\", \"fr\"). All the supported languages can be found [here](/identity-verification/supported-languages)";
                        readonly enum: readonly ["en", "ar", "bg", "ca", "cnr", "cs", "da", "de", "el", "es", "et", "fa", "fi", "fr", "he", "hi", "hr", "hu", "hy", "id", "it", "ja", "ka", "ko", "lt", "lv", "mk", "ms", "nl", "no", "pl", "pt-BR", "pt", "ro", "ru", "sk", "sl", "so", "sr", "sv", "th", "tr", "uk", "uz", "vi", "zh-CN", "zh-TW", "zh"];
                        readonly "x-readme-id": "1.2";
                    };
                    readonly phone: {
                        readonly type: "string";
                        readonly description: "Phone number in E.164 format (e.g., \"+14155552671\") that will be used during the [Phone Verification](/identity-verification/phone-verification/how-it-works) step. If not provided, the user must provide it during the verification flow.";
                        readonly "x-readme-id": "1.3";
                    };
                };
                readonly "x-readme-id": "0.4";
            };
            readonly expected_details: {
                readonly type: "object";
                readonly description: "Expected user details for cross-validation with extracted verification data.";
                readonly properties: {
                    readonly first_name: {
                        readonly type: "string";
                        readonly description: "User's first name. For example, `John`.";
                        readonly "x-readme-id": "1.0";
                    };
                    readonly last_name: {
                        readonly type: "string";
                        readonly description: "User's last name. For example, `Doe`.";
                        readonly "x-readme-id": "1.1";
                    };
                    readonly date_of_birth: {
                        readonly type: "string";
                        readonly format: "date";
                        readonly description: "User's date of birth with format: YYYY-MM-DD. For example, `1990-05-15`.";
                        readonly "x-readme-id": "1.2";
                    };
                    readonly gender: {
                        readonly type: "string";
                        readonly enum: readonly ["M", "F"];
                        readonly default: any;
                        readonly description: "User's gender. Must be either 'M', 'F', or null.";
                        readonly "x-readme-id": "1.3";
                    };
                    readonly nationality: {
                        readonly type: "string";
                        readonly description: "ISO 3166-1 alpha-3 country code representing the applicant's country of origin. For example, `USA`.";
                        readonly "x-readme-id": "1.4";
                    };
                    readonly country: {
                        readonly type: "string";
                        readonly description: "ISO 3166-1 alpha-3 country code representing the country of the Proof of Address document, or the country of the applicant's ID document, which may differ from nationality. For example, `GBR`.";
                        readonly "x-readme-id": "1.5";
                    };
                    readonly address: {
                        readonly type: "string";
                        readonly description: "The address in a human readable format, including as much information as possible. For example, `123 Main St, San Francisco, CA 94105, USA`.";
                        readonly "x-readme-id": "1.6";
                    };
                    readonly identification_number: {
                        readonly type: "string";
                        readonly description: "The user's document number, personal number, or tax number. For example, `123456789`.";
                        readonly "x-readme-id": "1.7";
                    };
                    readonly ip_address: {
                        readonly type: "string";
                        readonly format: "ipv4";
                        readonly description: "Expected IP address for the session. If the actual IP address differs from this value, a warning will be logged. For example, `192.168.1.100`.";
                        readonly "x-readme-id": "1.8";
                    };
                };
                readonly "x-readme-id": "0.5";
            };
            readonly portrait_image: {
                readonly type: "string";
                readonly description: "A Base64 encoded portrait image of the user's face, with a maximum size of 1MB. This image is only required for `Biometric Authentication` workflow types that have face match active to perform facial matching against the face captured during the liveness check.";
                readonly "x-readme-id": "0.6";
            };
        };
        readonly type: "object";
        readonly required: readonly ["workflow_id"];
        readonly $schema: "http://json-schema.org/draft-04/schema#";
    };
    readonly metadata: {
        readonly allOf: readonly [{
            readonly type: "object";
            readonly properties: {
                readonly "x-api-key": {
                    readonly type: "string";
                    readonly $schema: "http://json-schema.org/draft-04/schema#";
                    readonly description: "The API Key for your application. You can obtain it by following the [Quick Start Guide](/reference/quick-start#/).";
                };
            };
            readonly required: readonly ["x-api-key"];
        }];
    };
    readonly response: {
        readonly "201": {
            readonly type: "object";
            readonly properties: {
                readonly session_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Unique identifier for the session.";
                };
                readonly session_number: {
                    readonly type: "integer";
                    readonly description: "Sequential number assigned to the session.";
                };
                readonly session_token: {
                    readonly type: "string";
                    readonly description: "Token used to access the verification flow URL.";
                };
                readonly vendor_data: {
                    readonly type: "string";
                    readonly description: "Identifier provided by the vendor for tracking.";
                };
                readonly metadata: {
                    readonly type: "object";
                    readonly description: "Additional data associated with the session.";
                    readonly properties: {
                        readonly user_type: {
                            readonly type: "string";
                        };
                        readonly account_id: {
                            readonly type: "string";
                        };
                    };
                };
                readonly status: {
                    readonly type: "string";
                    readonly description: "Current status of the verification session.";
                };
                readonly workflow_id: {
                    readonly type: "string";
                    readonly format: "uuid";
                    readonly description: "Identifier of the workflow used for the session.";
                };
                readonly callback: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly description: "Callback URL to redirect the user after completion.";
                };
                readonly url: {
                    readonly type: "string";
                    readonly format: "uri";
                    readonly description: "URL for the user to complete the verification flow.";
                };
            };
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "400": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
        readonly "403": {
            readonly $schema: "http://json-schema.org/draft-04/schema#";
        };
    };
};
export { DeleteV1SessionSessionId, GetOrganizationsOrgIdApplicationAppIdSessions, GetV1SessionSessionIdGeneratePdf, GetV2SessionSessionIdDecision, PatchV1SessionSessionIdUpdateStatus, PostV1SessionSessionIdShare, PostV1SessionimportShared, PostV2AgeEstimation, PostV2Aml, PostV2DatabaseValidation, PostV2EmailCheck, PostV2EmailSend, PostV2FaceMatch, PostV2FaceSearch, PostV2IdVerification, PostV2PassiveLiveness, PostV2PhoneCheck, PostV2PhoneSend, PostV2Poa, PostV2Session };
