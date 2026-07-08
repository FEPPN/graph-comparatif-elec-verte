document.addEventListener('DOMContentLoaded', function() {
    // 1. On va chercher le NOUVEAU fichier JSON
    fetch('data-verte.json')
        .then(response => response.json())
        .then(data => {
            
            // 2. On identifie le fournisseur grâce au nom de la page HTML (ex: edf.html -> edf)
            const path = window.location.pathname;
            const pageName = path.split('/').pop().replace('.html', '').toLowerCase();

            // Fonction pour nettoyer les noms dans le JSON (enlever accents, espaces, etc.)
            function cleanName(str) {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            }

            // 3. On filtre pour ne garder que les données de ce fournisseur
            const providerData = data.filter(row => cleanName(row.provider_name) === cleanName(pageName));

            // Si aucune donnée n'est trouvée pour ce fournisseur, on arrête là
            if (providerData.length === 0) {
                console.log("Aucune donnée trouvée pour le fournisseur :", pageName);
                return;
            }

            // On trie les données par ordre chronologique
            providerData.sort((a, b) => new Date(a.scraping_month) - new Date(b.scraping_month));

            // 4. On isole les mois uniques (pour l'axe horizontal) et on garde les 24 derniers
            let uniqueMonths = [...new Set(providerData.map(item => item.scraping_month))];
            uniqueMonths = uniqueMonths.slice(-24);

            // 5. On prépare les deux boîtes pour ranger nos prix
            const prixClassique = []; // 0% vert
            const prixVert = [];      // 100% vert

            uniqueMonths.forEach(month => {
                // Pour chaque mois, on cherche les offres correspondantes
                const offresDuMois = providerData.filter(item => item.scraping_month === month);
                
                // On cherche l'offre 0%
                const classique = offresDuMois.find(item => item.green_energy_share.includes('0%'));
                // On cherche l'offre 100%
                const vert = offresDuMois.find(item => item.green_energy_share.includes('100%'));
                
                // On ajoute le prix dans le tableau (ou "null" si le fournisseur n'avait pas cette offre ce mois-là)
                prixClassique.push(classique ? classique.prix_moyen_kwh_base : null);
                prixVert.push(vert ? vert.prix_moyen_kwh_base : null);
            });

            // Formatage des dates pour faire joli sur le graphique (ex: 01/2024)
            const labelsMois = uniqueMonths.map(m => {
                const d = new Date(m);
                return (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
            });

            // 6. On dessine le graphique avec Chart.js !
            const ctx = document.getElementById('monGraphique').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelsMois,
                    datasets: [
                        {
                            label: 'Offre Classique (0% vert)',
                            data: prixClassique,
                            borderColor: '#95a5a6', // Gris
                            backgroundColor: 'rgba(149, 165, 166, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            fill: true,
                            spanGaps: true // Relie les points si un mois manque
                        },
                        {
                            label: 'Offre 100% Verte',
                            data: prixVert,
                            borderColor: '#27ae60', // Vert éclatant
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 4,
                            fill: true,
                            spanGaps: true
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            max: 0.35, // On garde le plafond à 0.35 comme avant
                            ticks: {
                                callback: function(value) { return value.toFixed(2).replace('.', ',') + ' €'; }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.dataset.label + ' : ' + context.parsed.y.toFixed(4) + ' € / kWh TTC';
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
});
