import "../../css/system.css";

export default function System() {
    return (
        <div className="page page-system marine-system">
            <header className="system-hero">
                <p className="system-eyebrow">System overview</p>
                <h1>How Larinae works</h1>
                <p>
                    Larinae is a maritime agency support system that transforms vessel nomination messages into
                    structured operational data. It combines document parsing, local LLM extraction, rule-based task
                    generation, vessel verification, and human review.
                </p>
            </header>

            <section className="system-layout">
                <article className="system-card system-card-large">
                    <h2>AI extraction engine</h2>
                    <p>
                        The extraction layer is based on Ollama running Qwen3 4B locally. The model receives cleaned
                        email and attachment text, then returns structured information about the ship, port call,
                        cargo, services, and additional operational requests.
                    </p>
                    <p>
                        The model does not make the final operational decision. It prepares a draft that the agent can
                        inspect, correct, save, and export.
                    </p>
                </article>

                <article className="system-card">
                    <h2>Input data</h2>
                    <ul className="system-list">
                        <li>Original EML nomination messages</li>
                        <li>PDF attachments with additional port-call information</li>
                        <li>Free-text operational requests from the email body</li>
                    </ul>
                </article>

                <article className="system-card">
                    <h2>Generated output</h2>
                    <ul className="system-list">
                        <li>Overview with vessel, IMO, ETA, and destination</li>
                        <li>PCS form fields</li>
                        <li>Agency task sections</li>
                        <li>Additional requests grouped by category</li>
                        <li>PDF-ready final summary</li>
                    </ul>
                </article>
            </section>

            <section className="system-process">
                <div className="system-section-header">
                    <p className="system-eyebrow">Processing pipeline</p>
                    <h2>Short workflow description</h2>
                </div>

                <div className="system-timeline">
                    <div className="system-timeline-item">
                        <span className="system-step-index">01</span>
                        <div>
                            <h3>Email and PDF text extraction</h3>
                            <p>
                                The uploaded email is converted into clean text. PDF attachments are also extracted and
                                added to the same processing flow.
                            </p>
                        </div>
                    </div>

                    <div className="system-timeline-item">
                        <span className="system-step-index">02</span>
                        <div>
                            <h3>LLM-based field extraction</h3>
                            <p>
                                Qwen3 4B identifies relevant maritime fields such as ship name, IMO number, ETA,
                                dimensions, draft, cargo, crew count, refuelling needs, provisions, customs, and
                                dangerous goods information.
                            </p>
                        </div>
                    </div>

                    <div className="system-timeline-item">
                        <span className="system-step-index">03</span>
                        <div>
                            <h3>Merge and conflict handling</h3>
                            <p>
                                Data extracted from the email and attachments is merged into one structured result.
                                Conflicting extraction results can be blocked or sent for review instead of being hidden.
                            </p>
                        </div>
                    </div>

                    <div className="system-timeline-item">
                        <span className="system-step-index">04</span>
                        <div>
                            <h3>Vessel verification</h3>
                            <p>
                                Selected ship parameters can be compared with external vessel data. Differences are
                                shown as warnings next to the relevant fields, so the agent can choose the correct value.
                            </p>
                        </div>
                    </div>

                    <div className="system-timeline-item">
                        <span className="system-step-index">05</span>
                        <div>
                            <h3>Task generation and review</h3>
                            <p>
                                The final JSON is converted into operational task cards. The user can review, edit,
                                save the result, and generate a PDF for further use.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="system-principles">
                <article>
                    <h2>Human-in-the-loop by design</h2>
                    <p>
                        Larinae is designed to support maritime agents, not replace them. The generated result should
                        always be reviewed before it is used in real port operations.
                    </p>
                </article>

                <article>
                    <h2>Local model deployment</h2>
                    <p>
                        Running the model through Ollama makes the extraction workflow easier to test locally and keeps
                        the system independent from external hosted LLM interfaces.
                    </p>
                </article>

                <article>
                    <h2>Clear operational structure</h2>
                    <p>
                        The interface presents extracted data as port-call sections and task groups, which makes it easier
                        for agency staff to check what must be arranged before the vessel arrives.
                    </p>
                </article>
            </section>
        </div>
    );
}