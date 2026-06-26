import "../../css/help.css";

export default function Help() {
    return (
        <div className="page page-help marine-help">
            <header className="help-hero">
                <p className="help-eyebrow">Help center</p>
                <h1>Using Larinae</h1>
                <p>
                    This page explains how to process vessel nominations, review extracted data, handle verification
                    warnings, and export the final port-call summary.
                </p>
            </header>

            <section className="help-grid">
                <article className="help-card">
                    <h2>How to process a nomination</h2>
                    <ol className="help-ordered-list">
                        <li>Open the upload page.</li>
                        <li>Select the original EML nomination message.</li>
                        <li>Add PDF attachments if the nomination contains supporting documents.</li>
                        <li>Submit the files and wait for the structured result.</li>
                        <li>Review the generated overview, PCS form, tasks, and additional requests.</li>
                    </ol>
                </article>

                <article className="help-card">
                    <h2>What should be checked manually?</h2>
                    <p>
                        Always confirm the key operational fields before using the result. Pay special attention to the
                        vessel name, IMO number, ETA, target port, cargo details, ship dimensions, draft, gross tonnage,
                        refuelling requirements, customs information, and dangerous goods declarations.
                    </p>
                </article>

                <article className="help-card">
                    <h2>Verification warnings</h2>
                    <p>
                        If the system finds a difference between extracted ship data and verified vessel data, a warning
                        appears next to the affected field. The warning shows both values: the extracted value from the
                        nomination and the verified value from the vessel database.
                    </p>
                    <p>
                        The system does not automatically overwrite the field. The agent should decide which value is
                        correct for the current port-call case.
                    </p>
                </article>

                <article className="help-card">
                    <h2>Editing generated data</h2>
                    <p>
                        Use edit mode in the result view to correct extracted values or adjust task details. After making
                        changes, save the result again so the corrected nomination can be loaded from history later.
                    </p>
                </article>

                <article className="help-card">
                    <h2>Saving and exporting</h2>
                    <p>
                        The result can be saved to the system history and exported as a PDF. The basic PDF should contain
                        the main operational sections, while the full PDF can include additional request details when they
                        are needed for coordination.
                    </p>
                </article>

                <article className="help-card">
                    <h2>When the extraction looks wrong</h2>
                    <ul className="help-list">
                        <li>Check whether the uploaded file is the correct nomination email.</li>
                        <li>Make sure all relevant attachments were included.</li>
                        <li>Review the original message for ambiguous wording or missing values.</li>
                        <li>Edit the generated fields manually before saving or exporting.</li>
                    </ul>
                </article>
            </section>

            <section className="help-support-box">
                <div>
                    <h2>Technical support</h2>
                    <p>
                        For access problems, failed uploads, incorrect parsing, or PDF generation errors, contact the
                        project support team and include the nomination ID if it is available.
                    </p>
                </div>

                <a className="help-support-link" href="mailto:support@larinae.local">
                    support@larinae.local
                </a>
            </section>
        </div>
    );
}