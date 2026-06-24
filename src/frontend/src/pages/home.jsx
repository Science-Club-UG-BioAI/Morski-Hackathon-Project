import "../css/home.css";

export default function Home() {
    return (
        <div className="page page-home marine-home">
            <section className="marine-hero">
                <div className="marine-hero-content">
                    <p className="marine-eyebrow">Maritime agency automation</p>

                    <h1 className="marine-hero-title">
                        Larinae helps port agents turn vessel nominations into clear operational tasks.
                    </h1>

                    <p className="marine-hero-text">
                        The system reads incoming nomination emails and attachments, extracts key vessel and port-call data,
                        verifies ship parameters, and prepares a structured task overview for agency teams.
                    </p>
                </div>

                <aside className="marine-hero-panel" aria-label="System summary">
                    <div className="marine-panel-row">
                        <span className="marine-panel-label">Input</span>
                        <span className="marine-panel-value">EML + PDF attachments</span>
                    </div>
                    <div className="marine-panel-row">
                        <span className="marine-panel-label">Engine</span>
                        <span className="marine-panel-value">Ollama Qwen3 4B</span>
                    </div>
                    <div className="marine-panel-row">
                        <span className="marine-panel-label">Output</span>
                        <span className="marine-panel-value">PCS data, tasks, PDF report</span>
                    </div>
                </aside>
            </section>

            <section className="marine-section">
                <div className="marine-section-header">
                    <p className="marine-eyebrow">Core purpose</p>
                    <h2>Built for everyday ship agency operations</h2>
                    <p>
                        Larinae reduces manual rewriting of port-call details and keeps the agent focused on verification,
                        coordination, and final decision-making.
                    </p>
                </div>

                <div className="marine-card-grid">
                    <article className="marine-card">
                        <span className="marine-card-number">01</span>
                        <h3>Nomination understanding</h3>
                        <p>
                            The system extracts vessel name, IMO number, ETA, destination port, cargo information,
                            crew count, dimensions, draft, and operational requests from unstructured messages.
                        </p>
                    </article>

                    <article className="marine-card">
                        <span className="marine-card-number">02</span>
                        <h3>Vessel data verification</h3>
                        <p>
                            Ship parameters can be checked against an external vessel database. If extracted values differ,
                            the interface highlights the mismatch without silently replacing the operator's data.
                        </p>
                    </article>

                    <article className="marine-card">
                        <span className="marine-card-number">03</span>
                        <h3>Operational task planning</h3>
                        <p>
                            Larinae groups the result into practical agency tasks such as PCS form completion, refuelling,
                            provisions delivery, cargo handling, dangerous goods reporting, and customs clearance.
                        </p>
                    </article>
                </div>
            </section>

            <section className="marine-workflow">
                <div className="marine-section-header marine-section-header-compact">
                    <p className="marine-eyebrow">Workflow</p>
                    <h2>From email to actionable port-call plan</h2>
                </div>

                <div className="marine-workflow-grid">
                    <div className="marine-workflow-step">
                        <span>1</span>
                        <h3>Upload</h3>
                        <p>Upload the original nomination email and optional PDF attachments.</p>
                    </div>

                    <div className="marine-workflow-step">
                        <span>2</span>
                        <h3>Extract</h3>
                        <p>The local LLM reads the content and converts it into structured JSON fields.</p>
                    </div>

                    <div className="marine-workflow-step">
                        <span>3</span>
                        <h3>Verify</h3>
                        <p>Selected vessel parameters are compared with trusted ship data.</p>
                    </div>

                    <div className="marine-workflow-step">
                        <span>4</span>
                        <h3>Review</h3>
                        <p>The agent checks generated sections, edits fields, and confirms additional requests.</p>
                    </div>

                    <div className="marine-workflow-step">
                        <span>5</span>
                        <h3>Export</h3>
                        <p>The final port-call summary can be saved in history or exported as a PDF document.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}