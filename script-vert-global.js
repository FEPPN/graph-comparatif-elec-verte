document.addEventListener('DOMContentLoaded', function() {
    fetch('data-verte.json')
        .then(response => response.json())
        .then(data => {
            
            // On trie les données chronologiquement
            data.sort((a, b) => new Date(a.scraping_month) - new Date(b.scraping_month));

            // On isole les mois uniques (les 24 derniers)
            let uniqueMonths = [...new Set(data.map(item => item.scraping_month))];
            uniqueMonths = uniqueMonths.slice(-24);

            const prixClassiqueGlobal = []; 
            const prixVertGlobal = [];      

            uniqueMonths.forEach(month => {
                // On prend toutes les offres de tous les fournisseurs pour ce mois précis
                const offresDuMois = data.filter(item => item.scraping_month === month);
                
                // On isole strictement les offres 0% (avec startsWith)
                const offresClassiques = offresDuMois.filter(item => item.green_energy_share.startsWith('0%'));
                if (offresClassiques.length > 0) {
                    // parseFloat() force le JSON à être lu comme un vrai nombre pour l'addition
                    const somme = offresClassiques.reduce((acc, curr) => acc + parseFloat(curr.prix_moyen_kwh_base), 0);
                    prixClassiqueGlobal.push(somme / offresClassiques.length);
                } else {
                    prixClassiqueGlobal.push(null);
                }

                // On isole strictement les offres 100%
                const offresVertes = offresDuMois.filter(item => item.green_energy_share.startsWith('100%'));
                if (offresVertes.length > 0) {
                    const somme = offresVertes.reduce((acc, curr) => acc + parseFloat(curr.prix_moyen_kwh_base), 0);
                    prixVertGlobal.push(somme / offresVertes.length);
                } else {
                    prixVertGlobal.push(null);
                }
            });

            // Formatage des labels (MM/YYYY)
            const labelsMois = uniqueMonths.map(m => {
                const d = new Date(m);
                return (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
            });

            // On dessine le graphique
            const canvas = document.getElementById('monGraphiqueGlobal');
            const ctx = canvas.getContext('2d');
            
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labelsMois,
                    datasets: [
                        {
                            label: 'Tarif moyen des offres 0% vertes',
                            data: prixClassiqueGlobal,
                            borderColor: '#95a5a6', 
                            backgroundColor: 'rgba(149, 165, 166, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            fill: true,
                            spanGaps: true,
                            tension: 0.4 
                        },
                        {
                            label: 'Tarif moyen des offres 100% vertes',
                            data: prixVertGlobal,
                            borderColor: '#27ae60', 
                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                            borderWidth: 2,
                            pointRadius: 0,
                            pointHoverRadius: 6,
                            fill: true,
                            spanGaps: true,
                            tension: 0.4 
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' }
                        },
                        y: {
                            min: 0.15, 
                            max: 0.35, 
                            grid: { display: true, color: 'rgba(0, 0, 0, 0.05)' },
                            ticks: {
                                stepSize: 0.05, 
                                callback: function(value) { return value.toFixed(2).replace('.', ',') + ' €'; }
                            }
                        }
                    },
                    plugins: {
                        tooltip: {
                            backgroundColor: 'rgba(44, 62, 80, 0.95)',
                            titleFont: { size: 13, family: 'Arial' },
                            bodyFont: { size: 12, family: 'Arial' },
                            padding: 10,
                            cornerRadius: 6,
                            callbacks: {
                                label: function(context) {
                                    let label = context.dataset.label || '';
                                    let val = context.parsed.y;
                                    if (label) label += ' : ';
                                    if (val !== null) {
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
