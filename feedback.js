/* ===========================================================
   Bellure Clinic — About page feedback form (individual task)

   Validates #feedback-form on about.html.
   - Rules come from the HTML attributes (required, type, minlength,
     maxlength, min); texts come from data-msg-* attributes.
   - Handles text, email, select, date, radio group, textarea, checkbox.
   - Bootstrap classes .is-valid / .is-invalid show the result.
   - novalidate on the form: Bootstrap feedback replaces browser pop-ups.
   - Demo only: nothing is sent or stored.
   =========================================================== */
(function () {
  'use strict';

  var form = document.getElementById('feedback-form');
  if (!form) { return; }

  var success = form.parentNode.querySelector('[data-success]');
  var fields = Array.prototype.slice.call(
    form.querySelectorAll('.form-control, .form-select, .form-check-input[type="checkbox"]')
  );
  var ratingGroup = document.getElementById('fb-rating-group');
  var ratingInputs = Array.prototype.slice.call(form.querySelectorAll('input[name="rating"]'));
  var ratingError = document.getElementById('fb-rating-error');
  var counter = form.querySelector('[data-count-for]');

  function msg(el, key, fallback) {
    return el.getAttribute('data-msg-' + key) || fallback;
  }

  function todayString() {
    var d = new Date();
    var m = ('0' + (d.getMonth() + 1)).slice(-2);
    var day = ('0' + d.getDate()).slice(-2);
    return d.getFullYear() + '-' + m + '-' + day;
  }

  /* ---------- 1. What is wrong with one field? ---------- */
  function getError(field) {
    var value = field.value;
    var trimmed = value.trim();

    if (field.type === 'checkbox') {
      return field.required && !field.checked
        ? msg(field, 'missing', 'This box must be ticked.') : '';
    }

    if (field.required && trimmed === '') {
      return msg(field, 'missing', 'This field is required.');
    }
    if (trimmed === '') { return ''; }

    if (field.type === 'email') {
      if (field.validity.typeMismatch || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return msg(field, 'type', 'Enter an email address like name@example.com.');
      }
    }

    if (field.type === 'date') {
      if (field.validity.badInput || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return msg(field, 'type', 'Enter a valid date.');
      }
      if (value > todayString()) { return msg(field, 'future', 'The date cannot be in the future.'); }
      if (field.min && value < field.min) { return msg(field, 'past', 'The date is too early.'); }
    }

    if (field.minLength > 0 && trimmed.length < field.minLength) {
      return msg(field, 'short', 'Enter at least ' + field.minLength + ' characters.');
    }
    if (field.maxLength > 0 && value.length > field.maxLength) {
      return msg(field, 'long', 'Use no more than ' + field.maxLength + ' characters.');
    }
    return '';
  }

  /* ---------- 2. Show the result ---------- */
  function feedbackFor(field) {
    var holder = field.type === 'checkbox' ? field.parentNode : field.parentNode;
    return holder.querySelector('.invalid-feedback');
  }

  function check(field) {
    var error = getError(field);
    field.setCustomValidity(error);
    var fb = feedbackFor(field);

    if (error) {
      field.classList.remove('is-valid');
      field.classList.add('is-invalid');
      field.setAttribute('aria-invalid', 'true');
      if (fb) { fb.textContent = error; }
    } else {
      field.classList.remove('is-invalid');
      field.classList.add('is-valid');
      field.removeAttribute('aria-invalid');
      if (fb) { fb.textContent = ''; }
    }
    return !error;
  }

  function checkRating() {
    var chosen = ratingInputs.some(function (r) { return r.checked; });
    ratingInputs.forEach(function (r) {
      r.classList.toggle('is-invalid', !chosen);
      r.classList.toggle('is-valid', false);
      if (!chosen) { r.setAttribute('aria-invalid', 'true'); } else { r.removeAttribute('aria-invalid'); }
    });
    ratingError.textContent = chosen ? '' : msg(ratingError, 'missing', 'Please choose a rating.');
    ratingError.classList.toggle('d-block', !chosen);
    return chosen;
  }

  function clearState(field) {
    field.classList.remove('is-valid', 'is-invalid');
    field.removeAttribute('aria-invalid');
    field.setCustomValidity('');
    var fb = feedbackFor(field);
    if (fb) { fb.textContent = ''; }
  }

  function updateCounter() {
    if (!counter) { return; }
    var target = document.getElementById(counter.getAttribute('data-count-for'));
    counter.textContent = target.value.length + ' / ' + target.maxLength;
  }

  /* ---------- 3. Events ---------- */
  fields.forEach(function (field) {
    var touched = false;
    field.addEventListener('blur', function () { touched = true; check(field); });
    field.addEventListener('input', function () {
      if (touched || field.classList.contains('is-invalid') || field.classList.contains('is-valid')) {
        check(field);
      }
      updateCounter();
    });
    field.addEventListener('change', function () { touched = true; check(field); });
  });

  ratingInputs.forEach(function (r) { r.addEventListener('change', checkRating); });

  // The date picker may not allow future dates in the picker UI either.
  var dateField = document.getElementById('fb-date');
  if (dateField) { dateField.max = todayString(); }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var first = null;

    fields.forEach(function (f) {
      if (!check(f) && !first) { first = f; }
    });
    // Keep DOM order: the rating sits between the date and the comment.
    var ratingOk = checkRating();
    if (!ratingOk) {
      var firstRating = ratingInputs[0];
      if (!first || (firstRating.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING)) {
        first = firstRating;
      }
    }

    if (first) {
      if (success) { success.classList.add('d-none'); }
      first.focus();
      return;
    }

    if (success) {
      success.querySelector('[data-greet-slot]').textContent = document.getElementById('fb-name').value.trim();
      success.querySelector('[data-doctor-slot]').textContent = document.getElementById('fb-doctor').value;
      var picked = form.querySelector('input[name="rating"]:checked');
      success.querySelector('[data-rating-slot]').textContent = picked ? picked.value : '';
      success.classList.remove('d-none');
      success.focus();
    }
  });

  form.addEventListener('reset', function () {
    fields.forEach(clearState);
    ratingInputs.forEach(function (r) { r.classList.remove('is-invalid', 'is-valid'); r.removeAttribute('aria-invalid'); });
    ratingError.textContent = '';
    ratingError.classList.remove('d-block');
    if (success) { success.classList.add('d-none'); }
    setTimeout(updateCounter, 0);
  });

  updateCounter();
})();
