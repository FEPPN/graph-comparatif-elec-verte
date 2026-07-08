document.addEventListener('DOMContentLoaded', function() {
    fetch('data-verte.json')
        .then(response => response.json())
        .then(data => {
            
            const path = window.location.pathname;
            const pageName = path.split('/').pop().replace('.html', '').toLowerCase();

            function cleanName(str) {
                return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                          .replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
            }

            const providerData = data.filter(row => cleanName(row.provider_name) === cleanName(pageName));

            if (providerData.length === 0) {
                console.log("Aucune donnée trouvée pour le fournisseur :", pageName);
                return;
            }

            providerData.sort((a, b) => new Date(a.scraping_month) - new Date(b.scraping_month));

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
                            pointHoverRadius: 6,
                            fill: true,
                            spanGaps: true,
                            tension: 0.4 // Rendu smooth des courbes
                        },
                        {
                            label: 'Offre 100% Verte',
                            data: prixVert,
                            borderColor: '#27ae60', // Vert éclatant
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            fill: true,
                            spanGaps: true,
                            tension: 0.4 // Rendu smooth des courbes
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    
                    // Cette option permet d'afficher l'encadré pour les 2 courbes en même temps au survol
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    
                    scales: {
                        x: {
                            grid: {
                                display: false // Supprime le quadrillage vertical
                            }
                        },
                        y: {
                            beginAtZero: false,
                            max: 0.35, 
                            grid: {
                                display: false // Supprime le quadrillage horizontal
                            },
                            ticks: {
                                callback: function(value) { return value.toFixed(2).replace('.', ',') + ' €'; }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            backgroundColor: 'rgba(44, 62, 80, 0.95)', // Fond de l'encadré élégant
                            titleFont: { size: 13, family: 'Arial' },
                            bodyFont: { size: 12, family: 'Arial' },
                            padding: 10,
                            cornerRadius: 6,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    let val = context.parsed.y;
                                    
                                    if (label) {
                                        label += ' : ';
                                    }
                                    if (val !== null) {
                                        // Formate le prix avec une virgule pour les décimales
                                        label += val.toFixed(4).replace('.', ',') + ' € / kWh TTC';
                                    } else {
                                        label += 'Non disponible';
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        })
        .catch(error => console.error('Erreur lors du chargement des données:', error));
});
