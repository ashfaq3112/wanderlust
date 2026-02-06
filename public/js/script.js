(function () {
    'use strict'
  
    // Wait for DOM to be fully loaded
    window.addEventListener('DOMContentLoaded', function() {
      // Fetch all the forms we want to apply custom Bootstrap validation styles to
      var forms = document.querySelectorAll('.needs-validation')
    
      // Loop over them and prevent submission
      Array.prototype.slice.call(forms)
        .forEach(function (form) {
          form.addEventListener('submit', function (event) {
            var isValid = true
            
            // Helper function to check if value contains only numbers
            function isOnlyNumbers(value) {
              var valueCleaned = value.replace(/[\s\.,;:!?\-_]/g, '')
              return /^\d+$/.test(valueCleaned) && !/[a-zA-Z]/.test(value)
            }
            
            // Check all required fields manually (since novalidate is set)
            var requiredFields = form.querySelectorAll('[required]')
            requiredFields.forEach(function(field) {
              // Remove previous validation classes
              field.classList.remove('is-valid', 'is-invalid')
              
              // Check if field has a value
              var fieldValue = field.value ? field.value.trim() : ''
              
              // Special validation for price field
              if (field.id === 'price') {
                // Check if price is empty
                if (fieldValue === '') {
                  field.classList.add('is-invalid')
                  isValid = false
                } 
                // Check if price is negative
                else {
                  var priceValue = parseFloat(fieldValue)
                  if (isNaN(priceValue) || priceValue < 0) {
                    // Price is negative or invalid - mark as invalid
                    field.classList.add('is-invalid')
                    isValid = false
                  } else {
                    // Price is valid (positive number) - mark as valid
                    field.classList.add('is-valid')
                  }
                }
              }
              // Validation for text fields that should not be only numbers (title, description, location, country)
              else if (field.id === 'title' || field.id === 'description' || field.id === 'location' || field.id === 'country') {
                // Hide both error messages first
                var emptyError = document.getElementById(field.id + '-error-empty')
                var numbersError = document.getElementById(field.id + '-error-numbers')
                if (emptyError) emptyError.style.display = 'none'
                if (numbersError) numbersError.style.display = 'none'
                
                // Check if field is empty
                if (fieldValue === '') {
                  field.classList.add('is-invalid')
                  if (emptyError) emptyError.style.display = 'block'
                  isValid = false
                } 
                // Check if field contains only numbers
                else if (isOnlyNumbers(fieldValue)) {
                  // Field is only numbers - mark as invalid and show numbers error
                  field.classList.add('is-invalid')
                  if (numbersError) numbersError.style.display = 'block'
                  isValid = false
                } else {
                  // Field contains letters/text - mark as valid
                  field.classList.add('is-valid')
                }
              }
              // Regular validation for other fields
              else {
                if (fieldValue === '') {
                  // Field is empty - mark as invalid (red border and show error message)
                  field.classList.add('is-invalid')
                  isValid = false
                } else {
                  // Field has value - mark as valid (green border)
                  field.classList.add('is-valid')
                }
              }
            })
            
            // Prevent form submission if invalid
            if (!isValid) {
              event.preventDefault()
              event.stopPropagation()
            }
    
            // Add was-validated class to show Bootstrap validation messages
            form.classList.add('was-validated')
          }, false)
        })
    })
  })()