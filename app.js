// =====================================================
// NOTRE CALENDRIER
// app.js COMPLET
// =====================================================


// =====================================================
// 1. SUPABASE
// =====================================================

const SUPABASE_URL =
    "https://eutvniauwrzssudxoldd.supabase.co";

const SUPABASE_KEY =
    "sb_publishable_RJGPiwpHk1iaD-c9Sq4jzA_Q6oesF88";

const supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY,
        {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        }
    );


// =====================================================
// 2. ÉTAT GLOBAL
// =====================================================

let utilisateurActuel = null;

let monCalendrier = null;

let calendriersPartages = [];

let calendrierAffiche = null;

let calendrierAfficheEstLeMien = true;

let evenements = [];

let listeFactures = [];

let canauxRealtime = [];

let dateCalendrier = new Date();


// =====================================================
// 3. FINANCES PERSONNELLES
// =====================================================

let paie =
    Number(
        localStorage.getItem("paie")
    ) || 0;

let depenses =
    Number(
        localStorage.getItem("depenses")
    ) || 0;

let frequencePaie =
    localStorage.getItem(
        "frequencePaie"
    ) || "";

let dateReferencePaie =
    localStorage.getItem(
        "dateReferencePaie"
    ) || "";

let historiquePaies =
    JSON.parse(
        localStorage.getItem(
            "historiquePaies"
        ) || "[]"
    );


// =====================================================
// 4. APPARENCE
// =====================================================

let themeApp =
    localStorage.getItem(
        "themeApp"
    ) || "auto";

let couleurPrincipale =
    localStorage.getItem(
        "couleurPrincipale"
    ) || "#007aff";

let couleurFond =
    localStorage.getItem(
        "couleurFond"
    ) || "#f2f2f7";


// =====================================================
// 5. OUTILS
// =====================================================

function element(id) {

    return document.getElementById(id);
}


function echapperHTML(valeur) {

    return String(
        valeur ?? ""
    )
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function formatArgent(montant) {

    return Number(
        montant || 0
    ).toLocaleString(
        "fr-CA",
        {
            style: "currency",
            currency: "CAD"
        }
    );
}


function convertirMontant(texte) {

    return Number(
        String(texte)
            .replace(/\s/g, "")
            .replace(/\$/g, "")
            .replace(",", ".")
    );
}


// =====================================================
// 6. SAUVEGARDE LOCALE
// =====================================================

function sauvegarderLocal() {

    localStorage.setItem(
        "paie",
        String(paie)
    );

    localStorage.setItem(
        "depenses",
        String(depenses)
    );

    localStorage.setItem(
        "frequencePaie",
        frequencePaie
    );

    localStorage.setItem(
        "dateReferencePaie",
        dateReferencePaie
    );

    localStorage.setItem(
        "historiquePaies",
        JSON.stringify(
            historiquePaies
        )
    );

    localStorage.setItem(
        "themeApp",
        themeApp
    );

    localStorage.setItem(
        "couleurPrincipale",
        couleurPrincipale
    );

    localStorage.setItem(
        "couleurFond",
        couleurFond
    );
}


// =====================================================
// 7. AUTHENTIFICATION
// =====================================================

function afficherMessageAuth(
    message,
    erreur = false
) {

    const zone =
        element("message-auth");

    if (!zone) {
        return;
    }

    zone.textContent =
        message;

    zone.classList.remove(
        "cachee",
        "message-erreur"
    );

    if (erreur) {

        zone.classList.add(
            "message-erreur"
        );
    }
}


function cacherMessageAuth() {

    element(
        "message-auth"
    )?.classList.add(
        "cachee"
    );
}


function afficherCreationCompte() {

    cacherMessageAuth();

    element(
        "form-connexion"
    )?.classList.add(
        "cachee"
    );

    element(
        "form-creation"
    )?.classList.remove(
        "cachee"
    );
}


function afficherConnexion() {

    cacherMessageAuth();

    element(
        "form-creation"
    )?.classList.add(
        "cachee"
    );

    element(
        "form-connexion"
    )?.classList.remove(
        "cachee"
    );
}


async function creerCompte() {

    const nom =
        element(
            "creation-nom"
        )?.value.trim() || "";

    const email =
        element(
            "creation-email"
        )?.value
            .trim()
            .toLowerCase() || "";

    const password =
        element(
            "creation-password"
        )?.value || "";

    const confirmation =
        element(
            "creation-password-confirm"
        )?.value || "";


    if (
        !nom ||
        !email ||
        !password ||
        !confirmation
    ) {

        afficherMessageAuth(
            "Remplis tous les champs.",
            true
        );

        return;
    }


    if (
        password.length < 6
    ) {

        afficherMessageAuth(
            "Le mot de passe doit contenir au moins 6 caractères.",
            true
        );

        return;
    }


    if (
        password !== confirmation
    ) {

        afficherMessageAuth(
            "Les mots de passe ne correspondent pas.",
            true
        );

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp(
            {
                email,
                password,

                options: {

                    emailRedirectTo:
                        "https://garrdyy.github.io/notre-calendrier/",

                    data: {
                        nom
                    }
                }
            }
        );


    if (error) {

        afficherMessageAuth(
            error.message,
            true
        );

        return;
    }


    if (data.session) {

        utilisateurActuel =
            data.user;

        await demarrerApplication();

        return;
    }


    afficherMessageAuth(
        "Compte créé. Vérifie ton courriel."
    );
}


async function seConnecter() {

    const email =
        element(
            "connexion-email"
        )?.value
            .trim()
            .toLowerCase() || "";

    const password =
        element(
            "connexion-password"
        )?.value || "";


    if (
        !email ||
        !password
    ) {

        afficherMessageAuth(
            "Entre ton courriel et ton mot de passe.",
            true
        );

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.auth
            .signInWithPassword(
                {
                    email,
                    password
                }
            );


    if (error) {

        afficherMessageAuth(
            error.message,
            true
        );

        return;
    }


    utilisateurActuel =
        data.user;


    await demarrerApplication();
}


async function seDeconnecter() {

    arreterRealtime();

    await supabaseClient.auth
        .signOut();

    location.reload();
}


// =====================================================
// 8. MON CALENDRIER
// =====================================================

async function chargerMonCalendrier() {

    if (!utilisateurActuel) {

        return false;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from("calendriers")
            .select(
                "id, nom, proprietaire_id, created_at"
            )
            .eq(
                "proprietaire_id",
                utilisateurActuel.id
            )
            .order(
                "created_at",
                {
                    ascending: true
                }
            )
            .limit(1)
            .maybeSingle();


    if (error) {

        console.error(
            "Erreur calendrier :",
            error
        );

        return false;
    }


    if (!data) {

        alert(
            "Ton calendrier personnel n'a pas été trouvé."
        );

        return false;
    }


    monCalendrier =
        data;


    return true;
}


// =====================================================
// 9. CALENDRIERS PARTAGÉS AVEC MOI
// =====================================================

async function chargerCalendriersPartages() {

    if (!utilisateurActuel) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "mes_calendriers_partages"
        );


    if (error) {

        console.error(
            "Erreur calendriers partagés :",
            error
        );

        calendriersPartages =
            [];

        remplirSelecteurCalendrier();

        afficherCalendriersPartagesParametres();

        return;
    }


    calendriersPartages =
        (data || []).map(
            function(item) {

                return {

                    id:
                        item.calendrier_id,

                    nom:
                        item.calendrier_nom,

                    proprietaire_id:
                        item.proprietaire_id,

                    proprietaire_nom:
                        item.proprietaire_nom || "",

                    proprietaire_email:
                        item.proprietaire_email || ""
                };
            }
        );


    remplirSelecteurCalendrier();

    afficherCalendriersPartagesParametres();
}


// =====================================================
// 10. SÉLECTEUR DU CALENDRIER
// =====================================================

function remplirSelecteurCalendrier() {

    const select =
        element(
            "select-calendrier"
        );


    if (
        !select ||
        !monCalendrier
    ) {

        return;
    }


    const ancienId =
        calendrierAffiche?.id ||
        monCalendrier.id;


    select.innerHTML =
        "";


    const optionMoi =
        document.createElement(
            "option"
        );


    optionMoi.value =
        monCalendrier.id;


    optionMoi.textContent =
        "👤 Mon calendrier";


    select.appendChild(
        optionMoi
    );


    calendriersPartages.forEach(
        function(calendrier) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                calendrier.id;


            const nom =
                calendrier
                    .proprietaire_nom
                    ?.trim();


            const email =
                calendrier
                    .proprietaire_email
                    ?.trim();


            if (nom) {

                option.textContent =
                    "👥 Calendrier de " +
                    nom;

            } else if (email) {

                option.textContent =
                    "👥 Calendrier de " +
                    email;

            } else {

                option.textContent =
                    "👥 Calendrier partagé";
            }


            select.appendChild(
                option
            );
        }
    );


    const existeEncore =
        [
            monCalendrier,
            ...calendriersPartages
        ].some(
            function(calendrier) {

                return (
                    calendrier.id ===
                    ancienId
                );
            }
        );


    if (existeEncore) {

        select.value =
            ancienId;

    } else {

        calendrierAffiche =
            monCalendrier;

        calendrierAfficheEstLeMien =
            true;

        select.value =
            monCalendrier.id;
    }


    afficherInfoCalendrier();
}


async function changerCalendrierAffiche(
    calendrierId
) {

    if (!monCalendrier) {

        return;
    }


    if (
        calendrierId ===
        monCalendrier.id
    ) {

        calendrierAffiche =
            monCalendrier;

        calendrierAfficheEstLeMien =
            true;

    } else {

        const partage =
            calendriersPartages.find(
                function(calendrier) {

                    return (
                        calendrier.id ===
                        calendrierId
                    );
                }
            );


        if (!partage) {

            calendrierAffiche =
                monCalendrier;

            calendrierAfficheEstLeMien =
                true;

        } else {

            calendrierAffiche =
                partage;

            calendrierAfficheEstLeMien =
                false;
        }
    }


    annulerModificationEvenement();

    afficherInfoCalendrier();

    mettreAJourFormulaireEvenement();

    await chargerEvenements();
}


function afficherInfoCalendrier() {

    const zone =
        element(
            "info-calendrier-selection"
        );


    if (
        !zone ||
        !calendrierAffiche
    ) {

        return;
    }


    if (
        calendrierAfficheEstLeMien
    ) {

        zone.textContent =
            "✏️ Ton calendrier personnel.";

        return;
    }


    const nom =
        calendrierAffiche
            .proprietaire_nom
            ?.trim();


    const email =
        calendrierAffiche
            .proprietaire_email
            ?.trim();


    const personne =
        nom ||
        email ||
        "cette personne";


    zone.textContent =
        "👁️ Calendrier de " +
        personne +
        " — consultation seulement.";
}


// =====================================================
// 11. CALENDRIERS PARTAGÉS DANS PARAMÈTRES
// =====================================================

function afficherCalendriersPartagesParametres() {

    const zone =
        element(
            "liste-calendriers-partages"
        );


    if (!zone) {

        return;
    }


    if (
        calendriersPartages.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucun calendrier partagé avec toi.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    calendriersPartages.forEach(
        function(calendrier) {

            const nom =
                calendrier
                    .proprietaire_nom
                    ?.trim() ||
                "Personne";


            const email =
                calendrier
                    .proprietaire_email
                    ?.trim() ||
                "";


            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "membre-card";


            bloc.innerHTML = `

                <div class="membre-haut">

                    <div>

                        <strong>
                            👤 ${echapperHTML(nom)}
                        </strong>

                        ${
                            email
                                ? `
                                <p class="texte-secondaire">
                                    ${echapperHTML(email)}
                                </p>
                                `
                                : ""
                        }

                    </div>

                    <span class="permission-public">
                        🟢 Visible
                    </span>

                </div>

                <p class="texte-secondaire">
                    Cette personne partage son calendrier avec toi.
                </p>

                <button
                    type="button"
                    onclick="voirCalendrierPartage('${calendrier.id}')"
                >
                    👁️ Voir le calendrier
                </button>
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


async function voirCalendrierPartage(
    calendrierId
) {

    changerPage(
        "calendrier"
    );


    const select =
        element(
            "select-calendrier"
        );


    if (select) {

        select.value =
            calendrierId;
    }


    await changerCalendrierAffiche(
        calendrierId
    );
}


// =====================================================
// 12. FORMULAIRE ÉVÉNEMENT
// =====================================================

function mettreAJourFormulaireEvenement() {

    const formulaire =
        element(
            "zone-formulaire-evenement"
        );


    if (!formulaire) {

        return;
    }


    if (
        calendrierAfficheEstLeMien
    ) {

        formulaire.style.display =
            "";

    } else {

        formulaire.style.display =
            "none";
    }
}


// =====================================================
// 13. REALTIME
// =====================================================

function arreterRealtime() {

    canauxRealtime.forEach(
        function(canal) {

            supabaseClient
                .removeChannel(
                    canal
                );
        }
    );


    canauxRealtime =
        [];
}


function demarrerRealtime() {

    arreterRealtime();


    if (
        !utilisateurActuel ||
        !monCalendrier
    ) {

        return;
    }


    // MON CALENDRIER

    const canalMonCalendrier =
        supabaseClient
            .channel(
                "mon-calendrier-" +
                monCalendrier.id
            )


            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "evenements",

                    filter:
                        "calendrier_id=eq." +
                        monCalendrier.id
                },

                async function() {

                    if (
                        calendrierAffiche?.id ===
                        monCalendrier.id
                    ) {

                        await chargerEvenements();
                    }
                }
            )


            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "factures",

                    filter:
                        "calendrier_id=eq." +
                        monCalendrier.id
                },

                async function() {

                    await chargerFactures();
                }
            )


            .on(
                "postgres_changes",
                {
                    event:
                        "*",

                    schema:
                        "public",

                    table:
                        "calendrier_membres",

                    filter:
                        "calendrier_id=eq." +
                        monCalendrier.id
                },

                async function() {

                    await chargerMembres();
                }
            )


            .subscribe();


    canauxRealtime.push(
        canalMonCalendrier
    );


    // MES PERMISSIONS

    const canalPermissions =
        supabaseClient
            .channel(
                "permissions-" +
                utilisateurActuel.id
            )


            .on(
                "postgres_changes",
                {
                    event:
                        "UPDATE",

                    schema:
                        "public",

                    table:
                        "calendrier_membres",

                    filter:
                        "utilisateur_id=eq." +
                        utilisateurActuel.id
                },

                async function() {

                    await verifierCalendriersPartages();
                }
            )


            .subscribe();


    canauxRealtime.push(
        canalPermissions
    );


    // ÉVÉNEMENTS DES CALENDRIERS PARTAGÉS

    calendriersPartages.forEach(
        function(calendrier) {

            const canal =
                supabaseClient
                    .channel(
                        "partage-" +
                        calendrier.id
                    )


                    .on(
                        "postgres_changes",
                        {
                            event:
                                "*",

                            schema:
                                "public",

                            table:
                                "evenements",

                            filter:
                                "calendrier_id=eq." +
                                calendrier.id
                        },

                        async function() {

                            if (
                                calendrierAffiche?.id ===
                                calendrier.id
                            ) {

                                await chargerEvenements();
                            }
                        }
                    )


                    .subscribe();


            canauxRealtime.push(
                canal
            );
        }
    );
}


async function verifierCalendriersPartages() {

    const ancienId =
        calendrierAffiche?.id ||
        null;


    await chargerCalendriersPartages();


    if (
        ancienId &&
        monCalendrier &&
        ancienId !==
        monCalendrier.id
    ) {

        const encoreVisible =
            calendriersPartages.some(
                function(calendrier) {

                    return (
                        calendrier.id ===
                        ancienId
                    );
                }
            );


        if (!encoreVisible) {

            calendrierAffiche =
                monCalendrier;

            calendrierAfficheEstLeMien =
                true;

            evenements =
                [];


            remplirSelecteurCalendrier();

            mettreAJourFormulaireEvenement();

            afficherCalendrierPrive();


            setTimeout(
                async function() {

                    await chargerEvenements();

                },
                800
            );
        }
    }


    demarrerRealtime();
}


function afficherCalendrierPrive() {

    const zone =
        element(
            "calendrier"
        );


    if (zone) {

        zone.innerHTML = `

            <div
                class="evenement-card"
                style="
                    grid-column:1 / -1;
                    text-align:center;
                    padding:24px;
                "
            >

                <strong>
                    🔒 Calendrier privé
                </strong>

                <p>
                    Cette personne ne partage plus son calendrier avec toi.
                </p>

            </div>
        `;
    }
}


// =====================================================
// 14. INVITATIONS
// =====================================================

async function envoyerInvitation() {

    if (!monCalendrier) {

        return;
    }


    const champ =
        element(
            "email-invitation"
        );


    const email =
        champ?.value
            .trim()
            .toLowerCase() || "";


    if (!email) {

        alert(
            "Entre une adresse courriel."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient.rpc(
            "envoyer_invitation",
            {
                calendrier:
                    monCalendrier.id,

                email_invite:
                    email
            }
        );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    champ.value =
        "";


    alert(
        "Invitation envoyée."
    );
}


async function chargerInvitationsRecues() {

    const zone =
        element(
            "invitations-recues"
        );


    if (
        !zone ||
        !utilisateurActuel?.email
    ) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "invitations"
            )
            .select(
                `
                id,
                calendrier_id,
                email,
                statut,
                created_at,
                calendriers (
                    nom
                )
                `
            )
            .eq(
                "statut",
                "en_attente"
            )
            .ilike(
                "email",
                utilisateurActuel.email
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (error) {

        console.error(
            "Erreur invitations :",
            error
        );

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Impossible de charger les invitations.
            </p>
            `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune invitation.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    data.forEach(
        function(invitation) {

            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "invitation-card";


            bloc.innerHTML = `

                <strong>
                    📨 Invitation
                </strong>

                <p>
                    ${
                        echapperHTML(
                            invitation
                                .calendriers
                                ?.nom ||
                            "Calendrier partagé"
                        )
                    }
                </p>

                <div class="invitation-actions">

                    <button
                        class="bouton-accepter"
                        type="button"
                        onclick="accepterInvitation('${invitation.id}')"
                    >
                        Accepter
                    </button>

                    <button
                        class="bouton-refuser"
                        type="button"
                        onclick="refuserInvitation('${invitation.id}')"
                    >
                        Refuser
                    </button>

                </div>
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


async function accepterInvitation(
    id
) {

    const {
        error
    } =
        await supabaseClient.rpc(
            "accepter_invitation",
            {
                invitation:
                    id
            }
        );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    alert(
        "Invitation acceptée."
    );


    await chargerInvitationsRecues();

    await chargerCalendriersPartages();

    demarrerRealtime();
}


async function refuserInvitation(
    id
) {

    const {
        error
    } =
        await supabaseClient.rpc(
            "refuser_invitation",
            {
                invitation:
                    id
            }
        );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await chargerInvitationsRecues();
}


// =====================================================
// 15. QUI PEUT VOIR MON CALENDRIER
// =====================================================

async function chargerMembres() {

    const zone =
        element(
            "liste-membres"
        );


    if (
        !zone ||
        !monCalendrier
    ) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient.rpc(
            "membres_de_mon_calendrier",
            {
                calendrier:
                    monCalendrier.id
            }
        );


    if (error) {

        console.error(
            "Erreur membres :",
            error
        );

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Impossible de charger les personnes invitées.
            </p>
            `;

        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune personne invitée.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    data.forEach(
        function(membre) {

            const visible =
                membre
                    .peut_voir_calendrier ===
                true;


            const nom =
                membre
                    .nom
                    ?.trim() ||
                "Personne invitée";


            const email =
                membre
                    .email
                    ?.trim() ||
                "";


            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "membre-card";


            bloc.innerHTML = `

                <div class="membre-haut">

                    <div>

                        <strong>
                            👤 ${echapperHTML(nom)}
                        </strong>

                        ${
                            email
                                ? `
                                <p class="texte-secondaire">
                                    ${echapperHTML(email)}
                                </p>
                                `
                                : ""
                        }

                    </div>

                    <span
                        class="${
                            visible
                                ? "permission-public"
                                : "permission-prive"
                        }"
                    >
                        ${
                            visible
                                ? "🟢 Public"
                                : "🔒 Privé"
                        }
                    </span>

                </div>

                <p class="texte-secondaire">

                    ${
                        visible
                            ? "Cette personne peut voir ton calendrier."
                            : "Cette personne ne voit pas ton calendrier."
                    }

                </p>

                <button
                    type="button"
                    onclick="changerVisibiliteMembre(
                        '${membre.utilisateur_id}',
                        ${visible ? "false" : "true"}
                    )"
                >
                    ${
                        visible
                            ? "🔒 Rendre privé"
                            : "🟢 Rendre public"
                    }
                </button>
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


async function changerVisibiliteMembre(
    utilisateurId,
    visible
) {

    if (!monCalendrier) {

        return;
    }


    const {
        error
    } =
        await supabaseClient.rpc(
            "modifier_visibilite_membre",
            {
                calendrier:
                    monCalendrier.id,

                membre:
                    utilisateurId,

                visible:
                    visible
            }
        );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await chargerMembres();
}


// =====================================================
// 16. ÉVÉNEMENTS
// =====================================================

async function chargerEvenements() {

    if (!calendrierAffiche) {

        evenements =
            [];

        afficherEvenements();

        afficherCalendrier();

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "evenements"
            )
            .select("*")
            .eq(
                "calendrier_id",
                calendrierAffiche.id
            )
            .order(
                "date",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(
            "Erreur événements :",
            error
        );

        evenements =
            [];

        afficherEvenements();

        afficherCalendrier();

        return;
    }


    evenements =
        data || [];


    afficherEvenements();

    afficherCalendrier();
}


async function enregistrerEvenement() {

    if (
        !calendrierAfficheEstLeMien ||
        !monCalendrier ||
        !utilisateurActuel
    ) {

        return;
    }


    const id =
        element(
            "evenement-id"
        )?.value || "";


    const type =
        element(
            "type-evenement"
        )?.value || "Travail";


    const date =
        element(
            "date-evenement"
        )?.value || "";


    const heureDebut =
        element(
            "heure-debut"
        )?.value || null;


    const heureFin =
        element(
            "heure-fin"
        )?.value || null;


    const repetition =
        element(
            "repetition-evenement"
        )?.value ||
        "Aucune";


    if (!date) {

        alert(
            "Choisis une date."
        );

        return;
    }


    let requete;


    if (id) {

        requete =
            supabaseClient
                .from(
                    "evenements"
                )
                .update(
                    {
                        type:
                            type,

                        date:
                            date,

                        heure_debut:
                            heureDebut,

                        heure_fin:
                            heureFin,

                        repetition:
                            repetition
                    }
                )
                .eq(
                    "id",
                    id
                )
                .eq(
                    "calendrier_id",
                    monCalendrier.id
                );

    } else {

        requete =
            supabaseClient
                .from(
                    "evenements"
                )
                .insert(
                    {
                        calendrier_id:
                            monCalendrier.id,

                        utilisateur_id:
                            utilisateurActuel.id,

                        type:
                            type,

                        date:
                            date,

                        heure_debut:
                            heureDebut,

                        heure_fin:
                            heureFin,

                        repetition:
                            repetition
                    }
                );
    }


    const {
        error
    } =
        await requete;


    if (error) {

        alert(
            error.message
        );

        return;
    }


    annulerModificationEvenement();

    await chargerEvenements();
}


function afficherEvenements() {

    const zone =
        element(
            "evenements"
        );


    if (!zone) {

        return;
    }


    if (
        evenements.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune journée enregistrée.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    evenements.forEach(
        function(item) {

            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "evenement-card";


            const typeTexte =
                item.type ===
                "Travail"
                    ? "💼 Travail"
                    : "🎓 École";


            const heureDebut =
                item.heure_debut
                    ? item.heure_debut.slice(
                        0,
                        5
                    )
                    : "-";


            const heureFin =
                item.heure_fin
                    ? item.heure_fin.slice(
                        0,
                        5
                    )
                    : "-";


            const actions =
                calendrierAfficheEstLeMien
                    ? `

                        <div class="invitation-actions">

                            <button
                                type="button"
                                onclick="modifierEvenement('${item.id}')"
                            >
                                ✏️ Modifier
                            </button>

                            <button
                                type="button"
                                class="bouton-refuser"
                                onclick="supprimerEvenement('${item.id}')"
                            >
                                🗑️ Supprimer
                            </button>

                        </div>
                    `
                    : "";


            bloc.innerHTML = `

                <strong>
                    ${typeTexte}
                </strong>

                <p>
                    📅 ${echapperHTML(item.date)}
                </p>

                <p>
                    🕐 ${heureDebut}
                    →
                    ${heureFin}
                </p>

                ${actions}
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


function modifierEvenement(
    id
) {

    if (
        !calendrierAfficheEstLeMien
    ) {

        return;
    }


    const item =
        evenements.find(
            function(evenement) {

                return (
                    evenement.id ===
                    id
                );
            }
        );


    if (!item) {

        return;
    }


    element(
        "evenement-id"
    ).value =
        item.id;


    element(
        "type-evenement"
    ).value =
        item.type;


    element(
        "date-evenement"
    ).value =
        item.date;


    element(
        "heure-debut"
    ).value =
        item.heure_debut
            ?.slice(
                0,
                5
            ) || "";


    element(
        "heure-fin"
    ).value =
        item.heure_fin
            ?.slice(
                0,
                5
            ) || "";


    element(
        "repetition-evenement"
    ).value =
        item.repetition ||
        "Aucune";


    element(
        "titre-formulaire-evenement"
    ).textContent =
        "✏️ Modifier une journée";


    element(
        "bouton-enregistrer-evenement"
    ).textContent =
        "💾 Enregistrer";


    element(
        "bouton-annuler-modification"
    )?.classList.remove(
        "cachee"
    );
}


function annulerModificationEvenement() {

    if (
        element(
            "evenement-id"
        )
    ) {

        element(
            "evenement-id"
        ).value =
            "";
    }


    if (
        element(
            "date-evenement"
        )
    ) {

        element(
            "date-evenement"
        ).value =
            "";
    }


    if (
        element(
            "heure-debut"
        )
    ) {

        element(
            "heure-debut"
        ).value =
            "";
    }


    if (
        element(
            "heure-fin"
        )
    ) {

        element(
            "heure-fin"
        ).value =
            "";
    }


    if (
        element(
            "repetition-evenement"
        )
    ) {

        element(
            "repetition-evenement"
        ).value =
            "Aucune";
    }


    if (
        element(
            "titre-formulaire-evenement"
        )
    ) {

        element(
            "titre-formulaire-evenement"
        ).textContent =
            "➕ Ajouter une journée";
    }


    if (
        element(
            "bouton-enregistrer-evenement"
        )
    ) {

        element(
            "bouton-enregistrer-evenement"
        ).textContent =
            "+ Ajouter au calendrier";
    }


    element(
        "bouton-annuler-modification"
    )?.classList.add(
        "cachee"
    );
}


async function supprimerEvenement(
    id
) {

    if (
        !calendrierAfficheEstLeMien
    ) {

        return;
    }


    if (
        !confirm(
            "Supprimer cette journée ?"
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "evenements"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await chargerEvenements();
}


// =====================================================
// 17. DATES
// =====================================================

function dateDepuisTexte(
    texte
) {

    if (!texte) {

        return null;
    }


    const parties =
        texte.split("-");


    const date =
        new Date(
            Number(
                parties[0]
            ),
            Number(
                parties[1]
            ) - 1,
            Number(
                parties[2]
            )
        );


    date.setHours(
        0,
        0,
        0,
        0
    );


    return date;
}


function dateVersTexte(
    date
) {

    return (
        date.getFullYear() +
        "-" +
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        ) +
        "-" +
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        )
    );
}


function ajouterJours(
    date,
    jours
) {

    const copie =
        new Date(
            date
        );


    copie.setDate(
        copie.getDate() +
        jours
    );


    return copie;
}


function memeJour(
    a,
    b
) {

    return (
        a.getFullYear() ===
            b.getFullYear() &&

        a.getMonth() ===
            b.getMonth() &&

        a.getDate() ===
            b.getDate()
    );
}


function nombreJoursEntre(
    a,
    b
) {

    const debut =
        Date.UTC(
            a.getFullYear(),
            a.getMonth(),
            a.getDate()
        );


    const fin =
        Date.UTC(
            b.getFullYear(),
            b.getMonth(),
            b.getDate()
        );


    return Math.round(
        (
            fin -
            debut
        ) /
        86400000
    );
}


function creerDateSecurisee(
    annee,
    mois,
    jour
) {

    const dernierJour =
        new Date(
            annee,
            mois + 1,
            0
        ).getDate();


    return new Date(
        annee,
        mois,
        Math.min(
            jour,
            dernierJour
        )
    );
}


function evenementEstCeJour(
    evenement,
    date
) {

    const debut =
        dateDepuisTexte(
            evenement.date
        );


    if (
        !debut ||
        date < debut
    ) {

        return false;
    }


    if (
        evenement.repetition ===
        "Hebdomadaire"
    ) {

        return (
            nombreJoursEntre(
                debut,
                date
            ) % 7 === 0
        );
    }


    return memeJour(
        debut,
        date
    );
}


// =====================================================
// 18. CALENDRIER VISUEL
// =====================================================

function afficherCalendrier() {

    const zone =
        element(
            "calendrier"
        );


    const titre =
        element(
            "titre-mois"
        );


    if (
        !zone ||
        !titre
    ) {

        return;
    }


    zone.innerHTML =
        "";


    const annee =
        dateCalendrier
            .getFullYear();


    const mois =
        dateCalendrier
            .getMonth();


    const nomsMois = [

        "Janvier",
        "Février",
        "Mars",
        "Avril",
        "Mai",
        "Juin",
        "Juillet",
        "Août",
        "Septembre",
        "Octobre",
        "Novembre",
        "Décembre"

    ];


    titre.textContent =
        nomsMois[mois] +
        " " +
        annee;


    const premierJour =
        new Date(
            annee,
            mois,
            1
        ).getDay();


    const nombreJours =
        new Date(
            annee,
            mois + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < premierJour;
        i++
    ) {

        const vide =
            document.createElement(
                "div"
            );


        vide.className =
            "jour-calendrier jour-vide";


        zone.appendChild(
            vide
        );
    }


    for (
        let jour = 1;
        jour <= nombreJours;
        jour++
    ) {

        const date =
            new Date(
                annee,
                mois,
                jour
            );


        const texteDate =
            dateVersTexte(
                date
            );


        const cellule =
            document.createElement(
                "div"
            );


        cellule.className =
            "jour-calendrier";


        if (
            calendrierAfficheEstLeMien
        ) {

            cellule.onclick =
                function() {

                    const champ =
                        element(
                            "date-evenement"
                        );


                    if (champ) {

                        champ.value =
                            texteDate;
                    }
                };
        }


        const numero =
            document.createElement(
                "div"
            );


        numero.className =
            "numero-jour";


        numero.textContent =
            jour;


        cellule.appendChild(
            numero
        );


        evenements
            .filter(
                function(item) {

                    return evenementEstCeJour(
                        item,
                        date
                    );
                }
            )
            .forEach(
                function(item) {

                    const bloc =
                        document.createElement(
                            "div"
                        );


                    bloc.className =
                        "evenement-calendrier";


                    const icone =
                        item.type ===
                        "Travail"
                            ? "💼"
                            : "🎓";


                    const heure =
                        item.heure_debut
                            ? item.heure_debut.slice(
                                0,
                                5
                            )
                            : "";


                    bloc.textContent =
                        heure
                            ? icone +
                                " " +
                                heure
                            : icone;


                    cellule.appendChild(
                        bloc
                    );
                }
            );


        zone.appendChild(
            cellule
        );
    }
}


function moisPrecedent() {

    dateCalendrier.setMonth(
        dateCalendrier.getMonth() -
        1
    );


    afficherCalendrier();
}


function moisSuivant() {

    dateCalendrier.setMonth(
        dateCalendrier.getMonth() +
        1
    );


    afficherCalendrier();
}


// =====================================================
// 19. CONFIGURATION PAIE
// =====================================================

function enregistrerConfigurationPaie() {

    frequencePaie =
        element(
            "frequence-paie"
        )?.value || "";


    dateReferencePaie =
        element(
            "date-reference-paie"
        )?.value || "";


    if (
        !dateReferencePaie
    ) {

        alert(
            "Choisis une date de paie."
        );

        return;
    }


    sauvegarderLocal();

    afficherApplication();
}


function modifierConfigurationPaie() {

    frequencePaie =
        element(
            "param-frequence-paie"
        )?.value || "";


    dateReferencePaie =
        element(
            "param-date-reference"
        )?.value || "";


    if (
        !dateReferencePaie
    ) {

        alert(
            "Choisis une date."
        );

        return;
    }


    sauvegarderLocal();

    mettreAJour();


    alert(
        "Paramètres enregistrés."
    );
}


// =====================================================
// 20. PÉRIODE DE PAIE
// =====================================================

function obtenirPeriodePaie() {

    if (
        !frequencePaie ||
        !dateReferencePaie
    ) {

        return null;
    }


    const maintenant =
        new Date();


    maintenant.setHours(
        0,
        0,
        0,
        0
    );


    const reference =
        dateDepuisTexte(
            dateReferencePaie
        );


    if (!reference) {

        return null;
    }


    if (
        frequencePaie ===
            "Hebdomadaire" ||
        frequencePaie ===
            "DeuxSemaines"
    ) {

        const intervalle =
            frequencePaie ===
            "Hebdomadaire"
                ? 7
                : 14;


        let debut =
            new Date(
                reference
            );


        while (
            debut >
            maintenant
        ) {

            debut =
                ajouterJours(
                    debut,
                    -intervalle
                );
        }


        while (
            ajouterJours(
                debut,
                intervalle
            ) <= maintenant
        ) {

            debut =
                ajouterJours(
                    debut,
                    intervalle
                );
        }


        return {

            debut:
                debut,

            fin:
                ajouterJours(
                    debut,
                    intervalle
                )
        };
    }


    if (
        frequencePaie ===
        "Mensuelle"
    ) {

        const jour =
            reference.getDate();


        let debut =
            creerDateSecurisee(
                maintenant.getFullYear(),
                maintenant.getMonth(),
                jour
            );


        if (
            debut >
            maintenant
        ) {

            debut =
                creerDateSecurisee(
                    maintenant.getFullYear(),
                    maintenant.getMonth() -
                    1,
                    jour
                );
        }


        return {

            debut:
                debut,

            fin:
                creerDateSecurisee(
                    debut.getFullYear(),
                    debut.getMonth() +
                    1,
                    jour
                )
        };
    }


    if (
        frequencePaie ===
        "DeuxFoisMois"
    ) {

        const annee =
            maintenant.getFullYear();

        const mois =
            maintenant.getMonth();

        const jour =
            maintenant.getDate();

        const dernierJour =
            new Date(
                annee,
                mois + 1,
                0
            ).getDate();


        if (
            jour >= 15 &&
            jour < dernierJour
        ) {

            return {

                debut:
                    new Date(
                        annee,
                        mois,
                        15
                    ),

                fin:
                    new Date(
                        annee,
                        mois,
                        dernierJour
                    )
            };
        }


        if (
            jour ===
            dernierJour
        ) {

            return {

                debut:
                    new Date(
                        annee,
                        mois,
                        dernierJour
                    ),

                fin:
                    new Date(
                        annee,
                        mois + 1,
                        15
                    )
            };
        }


        return {

            debut:
                new Date(
                    annee,
                    mois,
                    0
                ),

            fin:
                new Date(
                    annee,
                    mois,
                    15
                )
        };
    }


    return null;
}


// =====================================================
// 21. FACTURES
// =====================================================

async function chargerFactures() {

    if (!monCalendrier) {

        return;
    }


    const {
        data,
        error
    } =
        await supabaseClient
            .from(
                "factures"
            )
            .select("*")
            .eq(
                "calendrier_id",
                monCalendrier.id
            )
            .order(
                "premiere_date",
                {
                    ascending:
                        true
                }
            );


    if (error) {

        console.error(
            "Erreur factures :",
            error
        );

        listeFactures =
            [];

        afficherFactures();

        mettreAJour();

        return;
    }


    listeFactures =
        (data || []).map(
            function(facture) {

                return {

                    id:
                        facture.id,

                    nom:
                        facture.nom,

                    montant:
                        Number(
                            facture.montant
                        ),

                    date:
                        facture.premiere_date,

                    repetition:
                        facture.repetition
                };
            }
        );


    afficherFactures();

    mettreAJour();
}


async function ajouterNouvelleFacture() {

    const nom =
        element(
            "nom-facture"
        )?.value.trim() || "";


    const montant =
        Number(
            element(
                "montant-facture"
            )?.value || 0
        );


    const date =
        element(
            "date-facture"
        )?.value || "";


    const repetition =
        element(
            "repetition-facture"
        )?.value ||
        "Aucune";


    if (
        !nom ||
        !date ||
        montant <= 0
    ) {

        alert(
            "Remplis correctement la facture."
        );

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "factures"
            )
            .insert(
                {
                    calendrier_id:
                        monCalendrier.id,

                    cree_par:
                        utilisateurActuel.id,

                    nom:
                        nom,

                    montant:
                        montant,

                    premiere_date:
                        date,

                    repetition:
                        repetition,

                    payeur:
                        "Moi"
                }
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    element(
        "nom-facture"
    ).value =
        "";


    element(
        "montant-facture"
    ).value =
        "";


    element(
        "date-facture"
    ).value =
        "";


    await chargerFactures();
}


async function supprimerFacture(
    id
) {

    if (
        !confirm(
            "Supprimer cette facture ?"
        )
    ) {

        return;
    }


    const {
        error
    } =
        await supabaseClient
            .from(
                "factures"
            )
            .delete()
            .eq(
                "id",
                id
            );


    if (error) {

        alert(
            error.message
        );

        return;
    }


    await chargerFactures();
}


function afficherFactures() {

    const zone =
        element(
            "liste-factures"
        );


    if (!zone) {

        return;
    }


    if (
        listeFactures.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune facture enregistrée.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    listeFactures.forEach(
        function(facture) {

            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "evenement-card";


            bloc.innerHTML = `

                <strong>
                    🧾 ${echapperHTML(facture.nom)}
                </strong>

                <p>
                    💰 ${formatArgent(facture.montant)}
                </p>

                <p>
                    📅 ${echapperHTML(facture.date)}
                </p>

                <p>
                    🔁 ${echapperHTML(facture.repetition)}
                </p>

                <button
                    type="button"
                    class="bouton-refuser"
                    onclick="supprimerFacture('${facture.id}')"
                >
                    🗑️ Supprimer
                </button>
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


// =====================================================
// 22. OCCURRENCES FACTURES
// =====================================================

function factureEstCeJour(
    facture,
    date
) {

    const debut =
        dateDepuisTexte(
            facture.date
        );


    if (
        !debut ||
        date < debut
    ) {

        return false;
    }


    if (
        facture.repetition ===
        "Aucune"
    ) {

        return memeJour(
            debut,
            date
        );
    }


    if (
        facture.repetition ===
        "Hebdomadaire"
    ) {

        return (
            nombreJoursEntre(
                debut,
                date
            ) % 7 === 0
        );
    }


    if (
        facture.repetition ===
        "DeuxSemaines"
    ) {

        return (
            nombreJoursEntre(
                debut,
                date
            ) % 14 === 0
        );
    }


    if (
        facture.repetition ===
        "Mensuelle"
    ) {

        return (
            debut.getDate() ===
            date.getDate()
        );
    }


    if (
        facture.repetition ===
        "Annuelle"
    ) {

        return (
            debut.getDate() ===
                date.getDate() &&

            debut.getMonth() ===
                date.getMonth()
        );
    }


    return false;
}


function obtenirFacturesPeriode() {

    const periode =
        obtenirPeriodePaie();


    if (!periode) {

        return [];
    }


    const resultat =
        [];


    const date =
        new Date(
            periode.debut
        );


    while (
        date <
        periode.fin
    ) {

        listeFactures.forEach(
            function(facture) {

                if (
                    factureEstCeJour(
                        facture,
                        date
                    )
                ) {

                    resultat.push(
                        {
                            facture:
                                facture,

                            date:
                                new Date(
                                    date
                                )
                        }
                    );
                }
            }
        );


        date.setDate(
            date.getDate() +
            1
        );
    }


    return resultat;
}


// =====================================================
// 23. RÉSUMÉ FINANCIER
// =====================================================

function mettreAJour() {

    const factures =
        obtenirFacturesPeriode();


    const totalFactures =
        factures.reduce(
            function(
                total,
                item
            ) {

                return (
                    total +
                    Number(
                        item.facture
                            .montant
                    )
                );
            },
            0
        );


    const reste =
        paie -
        totalFactures -
        depenses;


    if (
        element("paie")
    ) {

        element(
            "paie"
        ).textContent =
            formatArgent(
                paie
            );
    }


    if (
        element(
            "factures-periode"
        )
    ) {

        element(
            "factures-periode"
        ).textContent =
            formatArgent(
                totalFactures
            );
    }


    if (
        element(
            "depenses"
        )
    ) {

        element(
            "depenses"
        ).textContent =
            formatArgent(
                depenses
            );
    }


    if (
        element(
            "reste"
        )
    ) {

        element(
            "reste"
        ).textContent =
            formatArgent(
                reste
            );
    }


    const periode =
        obtenirPeriodePaie();


    if (periode) {

        element(
            "periode-debut"
        ).textContent =
            periode.debut
                .toLocaleDateString(
                    "fr-CA"
                );


        element(
            "periode-fin"
        ).textContent =
            periode.fin
                .toLocaleDateString(
                    "fr-CA"
                );
    }


    afficherFacturesPeriode();

    afficherHistorique();

    sauvegarderLocal();
}


function afficherFacturesPeriode() {

    const zone =
        element(
            "liste-factures-periode"
        );


    if (!zone) {

        return;
    }


    const factures =
        obtenirFacturesPeriode();


    if (
        factures.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune facture sur cette paie.
            </p>
            `;

        return;
    }


    zone.innerHTML =
        "";


    factures.forEach(
        function(item) {

            const bloc =
                document.createElement(
                    "div"
                );


            bloc.className =
                "evenement-card";


            bloc.innerHTML = `

                <strong>
                    🧾 ${echapperHTML(item.facture.nom)}
                </strong>

                <p>
                    📅 ${
                        item.date
                            .toLocaleDateString(
                                "fr-CA"
                            )
                    }
                </p>

                <p>
                    💰 ${formatArgent(item.facture.montant)}
                </p>
            `;


            zone.appendChild(
                bloc
            );
        }
    );
}


// =====================================================
// 24. PAIE ET DÉPENSES
// =====================================================

function ajouterPaie() {

    const texte =
        prompt(
            "Combien as-tu reçu sur ta paie ?"
        );


    if (!texte) {

        return;
    }


    const valeur =
        convertirMontant(
            texte
        );


    if (
        !Number.isFinite(
            valeur
        ) ||
        valeur <= 0
    ) {

        return;
    }


    paie =
        valeur;


    mettreAJour();
}


function ajouterDepense() {

    const texte =
        prompt(
            "Montant de la dépense ?"
        );


    if (!texte) {

        return;
    }


    const valeur =
        convertirMontant(
            texte
        );


    if (
        !Number.isFinite(
            valeur
        ) ||
        valeur <= 0
    ) {

        return;
    }


    depenses +=
        valeur;


    mettreAJour();
}


function reinitialiserDepenses() {

    depenses =
        0;


    mettreAJour();
}


// =====================================================
// 25. HISTORIQUE
// =====================================================

function afficherHistorique() {

    const zone =
        element(
            "historique-paies"
        );


    if (!zone) {

        return;
    }


    if (
        historiquePaies.length === 0
    ) {

        zone.innerHTML =
            `
            <p class="texte-secondaire">
                Aucune paie enregistrée.
            </p>
            `;


        afficherTotauxMensuels();

        return;
    }


    zone.innerHTML =
        "";


    historiquePaies
        .slice()
        .reverse()
        .forEach(
            function(item) {

                const bloc =
                    document.createElement(
                        "div"
                    );


                bloc.className =
                    "evenement-card";


                bloc.innerHTML = `

                    <strong>
                        💵 ${echapperHTML(item.date)}
                    </strong>

                    <p>
                        Paie :
                        ${formatArgent(item.montant)}
                    </p>

                    <p>
                        Reste :
                        ${formatArgent(item.reste)}
                    </p>
                `;


                zone.appendChild(
                    bloc
                );
            }
        );


    afficherTotauxMensuels();
}


function afficherTotauxMensuels() {

    if (
        element(
            "total-paie-mois"
        )
    ) {

        element(
            "total-paie-mois"
        ).textContent =
            formatArgent(0);
    }


    if (
        element(
            "total-factures-mois"
        )
    ) {

        element(
            "total-factures-mois"
        ).textContent =
            formatArgent(0);
    }


    if (
        element(
            "total-depenses-mois"
        )
    ) {

        element(
            "total-depenses-mois"
        ).textContent =
            formatArgent(0);
    }


    if (
        element(
            "total-reste-mois"
        )
    ) {

        element(
            "total-reste-mois"
        ).textContent =
            formatArgent(0);
    }
}


// =====================================================
// 26. APPARENCE
// =====================================================

function appliquerApparence() {

    document.body.classList.remove(
        "theme-clair",
        "theme-sombre"
    );


    let theme =
        themeApp;


    if (
        theme ===
        "auto"
    ) {

        theme =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches
                ? "sombre"
                : "clair";
    }


    document.body.classList.add(
        theme ===
        "sombre"
            ? "theme-sombre"
            : "theme-clair"
    );


    document.documentElement.style
        .setProperty(
            "--couleur-principale",
            couleurPrincipale
        );


    document.documentElement.style
        .setProperty(
            "--couleur-fond",
            couleurFond
        );


    if (
        element(
            "theme-app"
        )
    ) {

        element(
            "theme-app"
        ).value =
            themeApp;
    }


    if (
        element(
            "couleur-principale"
        )
    ) {

        element(
            "couleur-principale"
        ).value =
            couleurPrincipale;
    }


    if (
        element(
            "couleur-fond"
        )
    ) {

        element(
            "couleur-fond"
        ).value =
            couleurFond;
    }


    const meta =
        element(
            "meta-theme-color"
        );


    if (meta) {

        meta.setAttribute(
            "content",
            couleurPrincipale
        );
    }
}


function modifierApparence() {

    themeApp =
        element(
            "theme-app"
        )?.value ||
        "auto";


    couleurPrincipale =
        element(
            "couleur-principale"
        )?.value ||
        "#007aff";


    couleurFond =
        element(
            "couleur-fond"
        )?.value ||
        "#f2f2f7";


    sauvegarderLocal();

    appliquerApparence();
}


function reinitialiserApparence() {

    themeApp =
        "auto";

    couleurPrincipale =
        "#007aff";

    couleurFond =
        "#f2f2f7";


    sauvegarderLocal();

    appliquerApparence();
}


// =====================================================
// 27. NAVIGATION
// =====================================================

function changerPage(
    page
) {

    const pages = [

        "accueil",
        "calendrier",
        "argent",
        "parametres"

    ];


    pages.forEach(
        function(nom) {

            element(
                "page-" +
                nom
            )?.classList.add(
                "cachee"
            );


            element(
                "nav-" +
                nom
            )?.classList.remove(
                "nav-actif"
            );
        }
    );


    element(
        "page-" +
        page
    )?.classList.remove(
        "cachee"
    );


    element(
        "nav-" +
        page
    )?.classList.add(
        "nav-actif"
    );


    window.scrollTo(
        0,
        0
    );


    if (
        page ===
        "calendrier"
    ) {

        remplirSelecteurCalendrier();

        afficherCalendrier();

        afficherEvenements();

        mettreAJourFormulaireEvenement();
    }


    if (
        page ===
        "parametres"
    ) {

        chargerInvitationsRecues();

        chargerMembres();

        afficherCalendriersPartagesParametres();
    }
}


// =====================================================
// 28. AFFICHER APPLICATION
// =====================================================

function afficherApplication() {

    appliquerApparence();


    const configuration =
        element(
            "configuration-initiale"
        );


    const application =
        element(
            "application-principale"
        );


    if (
        !configuration ||
        !application
    ) {

        return;
    }


    if (
        !frequencePaie ||
        !dateReferencePaie
    ) {

        configuration.style.display =
            "block";

        application.style.display =
            "none";

        return;
    }


    configuration.style.display =
        "none";

    application.style.display =
        "block";


    element(
        "param-frequence-paie"
    ).value =
        frequencePaie;


    element(
        "param-date-reference"
    ).value =
        dateReferencePaie;


    mettreAJour();

    afficherFactures();

    afficherHistorique();

    remplirSelecteurCalendrier();

    afficherCalendriersPartagesParametres();

    mettreAJourFormulaireEvenement();

    afficherCalendrier();

    afficherEvenements();


    changerPage(
        "accueil"
    );
}


// =====================================================
// 29. DÉMARRAGE
// =====================================================

async function demarrerApplication() {

    if (!utilisateurActuel) {

        return;
    }


    element(
        "zone-auth"
    )?.classList.add(
        "cachee"
    );


    element(
        "zone-application"
    )?.classList.remove(
        "cachee"
    );


    element(
        "utilisateur-connecte"
    ).textContent =
        utilisateurActuel.email;


    element(
        "email-parametres"
    ).textContent =
        utilisateurActuel.email;


    const calendrierOK =
        await chargerMonCalendrier();


    if (!calendrierOK) {

        return;
    }


    calendrierAffiche =
        monCalendrier;


    calendrierAfficheEstLeMien =
        true;


    await chargerCalendriersPartages();

    await chargerFactures();

    await chargerEvenements();

    await chargerInvitationsRecues();

    await chargerMembres();


    remplirSelecteurCalendrier();

    afficherCalendriersPartagesParametres();

    mettreAJourFormulaireEvenement();


    demarrerRealtime();


    afficherApplication();
}


// =====================================================
// 30. SESSION
// =====================================================

async function verifierSession() {

    const {
        data,
        error
    } =
        await supabaseClient.auth
            .getSession();


    if (error) {

        console.error(
            "Erreur session :",
            error
        );
    }


    if (
        data?.session?.user
    ) {

        utilisateurActuel =
            data.session.user;


        await demarrerApplication();

        return;
    }


    element(
        "zone-application"
    )?.classList.add(
        "cachee"
    );


    element(
        "zone-auth"
    )?.classList.remove(
        "cachee"
    );
}


// =====================================================
// 31. AUTH CHANGE
// =====================================================

supabaseClient.auth
    .onAuthStateChange(
        function(
            event,
            session
        ) {

            if (
                event ===
                "SIGNED_OUT"
            ) {

                arreterRealtime();

                utilisateurActuel =
                    null;

                return;
            }


            if (
                session?.user
            ) {

                utilisateurActuel =
                    session.user;
            }
        }
    );


// =====================================================
// 32. LANCEMENT
// =====================================================

appliquerApparence();

verifierSession();
