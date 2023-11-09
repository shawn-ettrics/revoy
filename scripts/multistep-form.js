const form = document.querySelector('#multistep-email-form')

const steps = form.querySelectorAll('.form-calculator-wrapper')

showStep(0)

steps.forEach((step, i) => {

    const backBtn = step.querySelector('a[data-form="back-btn"]');
    const nextBtn = step.querySelector('a[data-form="next-btn"]');

    
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            showStep(i-1)
        })
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showStep(i+1)
        })
    }
})

form.addEventListener('submit', (e) => {
    e.preventDefault();

    const inputs = this.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
        console.log('geo', input)
        input.remove()
    });

    this.submit()
})


function showStep(index) {

    steps.forEach(step => {
        step.style.display = 'none'
    })

    steps[index].style.display = 'flex'
}