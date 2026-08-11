
function uiAfficherProchainePaie() {
    const titre = document.getElementById("prochaine-paie");
    const detail = document.getElementById("prochaine-paie-detail");
    if (!titre || !detail) return;

    const periode = obtenirPeriodePaie();

    if (!periode || !periode.fin) {
        titre.textContent = "À configurer";
        detail.textContent = "Va dans Profil pour choisir ta fréquence et ta date de paie.";
        return;
    }

    const prochaine = new Date(periode.fin);
    prochaine.setHours(0, 0, 0, 0);

    const aujourdHui = new Date();
    aujourdHui.setHours(0, 0, 0, 0);

    const jours = Math.max(
        0,
        Math.round((prochaine - aujourdHui) / 86400000)
    );

    titre.textContent = prochaine.toLocaleDateString(
        "fr-CA",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );

    if (jours === 0) {
        detail.textContent = "C'est aujourd'hui 🎉";
    } else if (jours === 1) {
        detail.textContent = "Dans 1 jour";
    } else {
        detail.textContent = "Dans " + jours + " jours";
    }
}

// =====================================================
// NOTRE CALENDRIER - COUCHE D'INTERFACE FONCTIONNELLE
// Garde app.js pour Supabase et ajoute le comportement du nouveau design.
// =====================================================

let uiFiltreCalendrier = "tous";

function uiFormatDate(date) {
    return date.toLocaleDateString("fr-CA", {
        weekday: "long",
        day: "numeric",
        month: "short"
    });
}

function uiTexteMois(date) {
    const noms = [
        "Janvier","Février","Mars","Avril","Mai","Juin",
        "Juillet","Août","Septembre","Octobre","Novembre","Décembre"
    ];
    return noms[date.getMonth()] + " " + date.getFullYear();
}

function uiEstAujourdhui(date) {
    const a = new Date();
    return date.getFullYear() === a.getFullYear() &&
           date.getMonth() === a.getMonth() &&
           date.getDate() === a.getDate();
}

function uiMarqueursPourDate(date) {
    const texte = dateVersTexte(date);
    const marques = [];

    (evenements || []).forEach(function(item) {
        if (!evenementEstCeJour(item, date)) return;
        if (item.type === "Travail") {
            marques.push({ type: "travail", classe: "marque-travail" });
        } else {
            marques.push({ type: "ecole", classe: "marque-ecole" });
        }
    });

    (listeFactures || []).forEach(function(facture) {
        if (factureEstCeJour(facture, date)) {
            marques.push({ type: "factures", classe: "marque-facture" });
        }
    });

    (listeDepenses || []).forEach(function(depense) {
        if (depense.date_depense === texte) {
            marques.push({ type: "depenses", classe: "marque-depense" });
        }
    });

    if (uiFiltreCalendrier === "tous") return marques.slice(0, 4);
    return marques.filter(m => m.type === uiFiltreCalendrier).slice(0, 4);
}

function uiRendreCalendrierDans(zoneId, titreId, ouvrirFormulaire) {
    const zone = document.getElementById(zoneId);
    const titre = document.getElementById(titreId);
    if (!zone || !titre) return;

    titre.textContent = uiTexteMois(dateCalendrier);
    zone.innerHTML = "";

    const annee = dateCalendrier.getFullYear();
    const mois = dateCalendrier.getMonth();
    const premierJour = new Date(annee, mois, 1).getDay();
    const nbJours = new Date(annee, mois + 1, 0).getDate();

    for (let i = 0; i < premierJour; i++) {
        const vide = document.createElement("div");
        vide.className = "jour-calendrier jour-vide";
        zone.appendChild(vide);
    }

    for (let jour = 1; jour <= nbJours; jour++) {
        const date = new Date(annee, mois, jour);
        const cellule = document.createElement("div");
        cellule.className = "jour-calendrier";
        if (uiEstAujourdhui(date)) cellule.classList.add("jour-aujourdhui");

        const numero = document.createElement("div");
        numero.className = "numero-jour";
        numero.textContent = String(jour);
        cellule.appendChild(numero);

        uiMarqueursPourDate(date).forEach(function(marque) {
            const barre = document.createElement("div");
            barre.className = "evenement-calendrier " + marque.classe;
            cellule.appendChild(barre);
        });

        cellule.addEventListener("click", function() {
            const champ = document.getElementById("date-evenement");
            if (champ && calendrierAfficheEstLeMien) {
                champ.value = dateVersTexte(date);
                if (ouvrirFormulaire) {
                    changerPage("calendrier");
                    setTimeout(function() {
                        document.getElementById("zone-formulaire-evenement")
                            ?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 80);
                }
            }
        });

        zone.appendChild(cellule);
    }
}

const uiAfficherCalendrierOriginal = afficherCalendrier;
afficherCalendrier = function() {
    uiRendreCalendrierDans("calendrier", "titre-mois", true);
    uiRendreCalendrierDans("calendrier-detail", "titre-mois-detail", false);
};

const uiAfficherCalendrierPriveOriginal = afficherCalendrierPrive;
afficherCalendrierPrive = function() {
    uiAfficherCalendrierPriveOriginal();
    const detail = document.getElementById("calendrier-detail");
    if (detail) {
        detail.innerHTML =
            '<div style="grid-column:1/-1;padding:28px;text-align:center"><strong>🔒 Calendrier privé</strong><p class="texte-secondaire">Cette personne ne partage pas son calendrier avec toi.</p></div>';
    }
};

function uiFiltrerCalendrier(filtre, bouton) {
    uiFiltreCalendrier = filtre;
    document.querySelectorAll("#filtres-calendrier button").forEach(b => b.classList.remove("selected"));
    bouton?.classList.add("selected");
    afficherCalendrier();
}

function uiAfficherOnglet(onglet) {
    const ev = document.getElementById("tab-evenements");
    const fi = document.getElementById("tab-finances");
    ev?.classList.toggle("active", onglet === "evenements");
    fi?.classList.toggle("active", onglet === "finances");

    if (onglet === "finances") {
        document.getElementById("carte-finances-accueil")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        document.getElementById("zone-calendrier-accueil")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function uiAjouterAujourdHui() {
    changerPage("calendrier");
    const champ = document.getElementById("date-evenement");
    if (champ) champ.value = dateVersTexte(new Date());
    setTimeout(function() {
        document.getElementById("zone-formulaire-evenement")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
}

function uiNombre(texte) {
    return Number(String(texte || "0")
        .replace(/\s/g, "")
        .replace("$", "")
        .replace(",", ".")
        .replace(/[^\d.-]/g, "")) || 0;
}

function uiSynchroniserFinances() {
    uiAfficherProchainePaie();
    const ids = [
        ["paie","paie-mirror"],
        ["paie","paie-page"],
        ["factures-periode","factures-page"],
        ["depenses","depenses-page"],
        ["reste","reste-mirror"],
        ["reste","reste-page"]
    ];

    ids.forEach(function(pair) {
        const source = document.getElementById(pair[0]);
        const cible = document.getElementById(pair[1]);
        if (source && cible) cible.textContent = source.textContent;
    });

    const revenus = uiNombre(document.getElementById("paie")?.textContent);
    const factures = uiNombre(document.getElementById("factures-periode")?.textContent);
    const dep = uiNombre(document.getElementById("depenses")?.textContent);
    const total = Math.max(revenus, factures + dep, 1);
    const pf = Math.min(100, Math.max(0, factures / total * 100));
    const pd = Math.min(100 - pf, Math.max(0, dep / total * 100));
    const p1 = pf.toFixed(2);
    const p2 = (pf + pd).toFixed(2);
    const donut = document.getElementById("donut-budget");
    if (donut) {
        donut.style.background =
            `conic-gradient(var(--teal) 0 ${p1}%, var(--purple) ${p1}% ${p2}%, var(--cyan) ${p2}% 100%)`;
    }
}

function uiProchainsItems() {
    const resultat = [];
    const maintenant = new Date();
    maintenant.setHours(0,0,0,0);

    for (let decalage = 0; decalage <= 90 && resultat.length < 12; decalage++) {
        const date = ajouterJours(maintenant, decalage);

        (listeFactures || []).forEach(function(facture) {
            if (factureEstCeJour(facture, date)) {
                resultat.push({
                    cle: "f-" + facture.id + "-" + dateVersTexte(date),
                    type: "facture",
                    nom: facture.nom,
                    montant: Number(facture.montant || 0),
                    date: new Date(date)
                });
            }
        });

        (evenements || []).forEach(function(ev) {
            if (evenementEstCeJour(ev, date)) {
                resultat.push({
                    cle: "e-" + ev.id + "-" + dateVersTexte(date),
                    type: ev.type === "Ecole" ? "ecole" : "travail",
                    nom: ev.type === "Ecole" ? "Jour d'école" : "Journée de travail",
                    montant: null,
                    date: new Date(date)
                });
            }
        });
    }

    return resultat
        .sort((a,b) => a.date - b.date)
        .slice(0, 3);
}

function uiRendreProchainsEvenements() {
    const zone = document.getElementById("prochains-evenements");
    if (!zone) return;

    const items = uiProchainsItems();
    if (!items.length) {
        zone.innerHTML = '<p class="texte-secondaire" style="padding:16px 0">Aucun événement à venir.</p>';
        return;
    }

    zone.innerHTML = "";
    items.forEach(function(item) {
        const row = document.createElement("div");
        row.className = "upcoming-row";

        const icone = document.createElement("div");
        icone.className = "upcoming-icon" + (item.type === "ecole" ? " school" : "");
        icone.textContent = item.type === "ecole" ? "♢" : item.type === "travail" ? "▣" : "▢";

        const copy = document.createElement("div");
        copy.className = "upcoming-copy";
        const titre = document.createElement("strong");
        titre.textContent = item.nom;
        const date = document.createElement("span");
        date.textContent = uiFormatDate(item.date);
        copy.append(titre, date);

        const droite = document.createElement("div");
        if (item.montant !== null) {
            droite.className = "upcoming-amount";
            droite.textContent = formatArgent(item.montant);
        } else {
            droite.textContent = "•";
            droite.style.color = item.type === "ecole" ? "var(--purple)" : "var(--green)";
            droite.style.fontSize = "28px";
        }

        row.append(icone, copy, droite);
        row.addEventListener("click", function() {
            changerPage("calendrier");
            const champ = document.getElementById("date-evenement");
            if (champ && calendrierAfficheEstLeMien) champ.value = dateVersTexte(item.date);
        });
        zone.appendChild(row);
    });
}

function uiMettreAJourBadgeInvitations() {
    const zone = document.getElementById("invitations-recues");
    const badge = document.getElementById("badge-invitations");
    if (!badge || !zone) return;
    const nombre = zone.querySelectorAll(".invitation-card").length;
    badge.textContent = String(nombre);
    badge.classList.toggle("cachee", nombre === 0);
}

// Navigation à 5 onglets (Accueil, Calendrier, Argent, Partage, Profil)
changerPage = function(page) {
    const pages = ["accueil","calendrier","argent","partage","parametres"];

    pages.forEach(function(nom) {
        document.getElementById("page-" + nom)?.classList.add("cachee");
        document.getElementById("nav-" + nom)?.classList.remove("nav-actif");
    });

    document.getElementById("page-" + page)?.classList.remove("cachee");
    document.getElementById("nav-" + page)?.classList.add("nav-actif");
    window.scrollTo(0,0);

    if (page === "accueil") {
        afficherCalendrier();
        uiSynchroniserFinances();
        uiRendreProchainsEvenements();
    }

    if (page === "calendrier") {
        remplirSelecteurCalendrier();
        afficherCalendrier();
        afficherEvenements();
        mettreAJourFormulaireEvenement();
    }

    if (page === "argent") {
        uiSynchroniserFinances();
        afficherHistorique();
        afficherFactures();
    }

    if (page === "partage") {
        chargerInvitationsRecues();
        chargerMembres();
        afficherCalendriersPartagesParametres();
        setTimeout(uiMettreAJourBadgeInvitations, 150);
    }

    if (page === "parametres") {
        const f = document.getElementById("param-frequence-paie");
        const d = document.getElementById("param-date-reference");
        if (f) f.value = frequencePaie;
        if (d) d.value = dateReferencePaie;
    }
};

// Décore les mises à jour de l'app d'origine.
const uiMettreAJourOriginal = mettreAJour;
mettreAJour = function() {
    uiMettreAJourOriginal();
    uiSynchroniserFinances();
    uiRendreProchainsEvenements();
    afficherCalendrier();
};

const uiAfficherEvenementsOriginal = afficherEvenements;
afficherEvenements = function() {
    uiAfficherEvenementsOriginal();
    uiRendreProchainsEvenements();
    afficherCalendrier();
};

const uiAfficherFacturesOriginal = afficherFactures;
afficherFactures = function() {
    uiAfficherFacturesOriginal();
    uiRendreProchainsEvenements();
    afficherCalendrier();
};

const uiChargerInvitationsOriginal = chargerInvitationsRecues;
chargerInvitationsRecues = async function() {
    await uiChargerInvitationsOriginal();
    uiMettreAJourBadgeInvitations();
};

window.addEventListener("DOMContentLoaded", function() {
    const zoneInvitations = document.getElementById("invitations-recues");
    if (zoneInvitations) {
        new MutationObserver(uiMettreAJourBadgeInvitations)
            .observe(zoneInvitations, { childList:true, subtree:true });
    }

    ["paie","factures-periode","depenses","reste"].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            new MutationObserver(function() {
                uiSynchroniserFinances();
                uiRendreProchainsEvenements();
            }).observe(el, { childList:true, subtree:true, characterData:true });
        }
    });

    setTimeout(function() {
        uiSynchroniserFinances();
        uiRendreProchainsEvenements();
        afficherCalendrier();
        uiMettreAJourBadgeInvitations();
    }, 250);
});
