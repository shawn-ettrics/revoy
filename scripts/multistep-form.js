const form = document.querySelector('#multistep-email-form')

const steps = form.querySelectorAll('.form-calculator-wrapper')

showStep(0)

steps.forEach((step, i) => {

    const backBtn = step.querySelector('a[data-form="back-btn"]');
    const nextBtn = step.querySelector('a[data-form="next-btn"]');

    console.log(backBtn, nextBtn)
    
    if (backBtn) {
        console.log('bk btn exist')
        backBtn.addEventListener('click', () => {
            showStep(i-1)
            console.log('bk btn clicked')
        })
    }
    if (nextBtn) {
        console.log('nx btn exist')
        nextBtn.addEventListener('click', () => {
            showStep(i+1)
            console.log('nx btn clicked')
        })
    }
})

form.addEventListener('submit', (e) => {
    e.preventDefault();
    console.log('form submit triggered')

    const inputs = this.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
        console.log('geo', input)
        input.remove()
    });

    this.submit()
})


function showStep(index) {

    console.log('showStep called')

    steps.forEach(step => {
        step.style.display = 'none'
    })

    steps[index].style.display = 'block'
}