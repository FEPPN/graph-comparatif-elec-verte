document.addEventListener('DOMContentLoaded', function() {
    // 1. On va chercher le NOUVEAU fichier JSON
    fetch('data-verte.json')
        .then(response => response.json())
        .then(data => {
            
            // 2. On identifie le fournisseur grâce au nom de la page HTML
            const path = window.location.pathname;
            const pageName = path.split('/').pop().replace('.html', '').toLowerCase();

            function cleanName(str) {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            }

            // 3. On filtre pour le fournisseur de la page
            const providerData = data.filter(row => cleanName(row.provider_name) === cleanName(pageName));

            if (providerData.length === 0) {
                console.log("Aucune donnée trouvée pour le fournisseur :", pageName);
                return;
            }

            providerData.sort((a, b) => new Date(a.scraping_month) - new Date(b.scraping_month));

            // 4. On isole les mois uniques et on garde les 24 derniers
            let uniqueMonths = [...new Set(providerData.map(item => item.scraping_month))];
            uniqueMonths = uniqueMonths.slice(-24);

            const prixClassique = []; 
            const prixVert = [];      

            uniqueMonths.forEach(month => {
                const offresDuMois = providerData.filter(item => item.scraping_month === month);
                
                const classique = offresDuMois.find(item => item.green_energy_share.includes('0%'));
                const vert = offresDuMois.find(item => item.green_energy_share.includes('100%'));
                
                prixClassique.push(classique ? classique.prix_moyen_kwh_base : null);
                prixVert.push(vert ? vert.prix_moyen_kwh_base : null);
            });

            const labelsMois = uniqueMonths.map(m => {
                const d = new Date(m);
                return (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
            });

            // 5. On dessine le graphique
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
                            spanGaps: true
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
                            max: 0.35, 
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
