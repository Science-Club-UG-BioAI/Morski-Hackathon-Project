import data from "../../../model/save/2.json";

export default function History() {
    return (
        <div className="page page-history-private">
            <h1>History Panel</h1>

            <div className="history-card">
                <h3>ID: {data.id}</h3>

                <p>
                    <strong>Ship Name:</strong>{" "}
                    {data.task["Fill PCS form"]["Ship Name"]}
                </p>

                <p>
                    <strong>Ship IMO number:</strong>{" "}
                    {data.task["Fill PCS form"]["Ship IMO number"]}
                </p>
            </div>
        </div>
    );
}