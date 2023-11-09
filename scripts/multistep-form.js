const form = document.querySelector('#multistep-email-form')

const steps = form.querySelectorAll('.form-calculator-wrapper')

steps.forEach((step, i) => {

    const backBtn = step.querySelector('element[data-form="back-btn"]');
    const nextBtn = step.querySelector('element[data-form="next-btn"]');
    
    if (backBtn) {
        backBtn.onclick = () => {
            showStep(i-1)
        }
    }
    if (nextBtn) {
        nextBtn.onclick = () => {
            showStep(i+1)
        }
    }
})

form.onsubmit = function(e) {


    e.preventDefault();
    console.log('form submit triggered')

    const inputs = this.querySelectorAll('.mapboxgl-ctrl-geocoder input');
    inputs.forEach(input => {
        console.log('geo', input)
        input.remove(); // This will remove the input from the DOM
    });

    this.submit(); // Call the form's submit method to continue the submission
};


function showStep(index) {

    steps.forEach(step => {
        step.style.display = 'none'
    })

    steps[index].style.display = 'block'
}