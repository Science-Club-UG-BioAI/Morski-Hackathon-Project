
export default function Help(){
    return (
        <div className="page page-help">
            <header className="page-header">
                <h1 className="page-title">Pomoc i Wsparcie</h1>
                <p className="page-intro">
                    Tutaj znajdziesz informacje dotyczące logowania do systemu oraz dane kontaktowe
                    w razie problemów z dostępem.
                </p>
            </header>
            <section className="card-grid">
                <article className="card">
                    <h2 className="card-title">Jak się zalogować?</h2>
                    <p className="card-text">
                        1. Kliknij przycisk <strong>"Zaloguj się"</strong> w górnym pasku nawigacji. <br/>
                        2. Wprowadź login i hasło przypisane do Twojego konta słuzbowego. <br/>
                        3. Zatwierdź przyciskiem <strong>"Zaloguj"</strong>. <br/>
                        4. Po poprawym logowaniu zostaniesz przeniesiony do panelu pracowniczego.
                    </p>
                </article>
                <article className="card">
                    <h2 className="card-title">Problemy z logowaniem</h2>
                        <p className="card-text">
                            Jeśli hasło zostało zapomniane lub podejrzewasz, ze Twoje konto mogło zostać 
                            przejęte, skontaktuj się z Administratorem systemu w swojeje jednostce.
                        </p>
                        <br></br>
                        <p className="card-text">
                            W przypadku niedostępności systemu sprawdź komunikaty o pracach serwisowych
                            lub zgłoś problem do zespołu wsparcia.
                        </p>
                </article>
                <article className="card">
                    <h2 className="card-title">Kontakt techniczny</h2>
                    <br></br>
                    <p className="card-text">
                        e-mail: <a className="link-primary" href="mailto:support@budzet.gov.pl">support@budzet.gov.pl</a><br />
                        telefon: 000 670 000 <br></br>
                        (czynny w dni robocze w godzinach 8:00-16:00)
                    </p>
                </article>
            </section>
        </div>
    );
}



