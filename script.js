const landing = document.querySelector(".landing");
const formPage = document.querySelector(".form-page");
const landingJoinButton = document.querySelector(".join-button");
const form = document.querySelector(".join-form");
const submitButton = document.querySelector(".form-submit");
const numberInput = document.querySelector("#lucky-number");
const successPage = document.querySelector(".success-page");
const failurePage = document.querySelector(".failure-page");
const emailForm = document.querySelector(".email-form");
const emailSubmitButton = document.querySelector(".email-submit");
const emailSent = document.querySelector(".email-sent");

const pages = [landing, formPage, successPage, failurePage];

function showPage(page, hash) {
  pages.forEach((currentPage) => {
    currentPage.hidden = currentPage !== page;
  });
  document.body.classList.toggle("failure-active", page === failurePage);
  window.scrollTo({ top: 0, left: 0 });
  history.replaceState(null, "", hash);
}

function showForm() {
  showPage(formPage, "#join-form");
}

function updateSubmitState() {
  submitButton.disabled = !form.checkValidity();
}

function updateEmailSubmitState() {
  emailSubmitButton.disabled = !emailForm.checkValidity();
}

function isEvenNumber(value) {
  return value !== "" && Number(value) % 2 === 0;
}

function showResult() {
  const formData = new FormData(form);
  const believesInGhosts = formData.get("ghosts") === "yes";
  const pickedEvenNumber = isEvenNumber(formData.get("lucky-number"));

  if (believesInGhosts && pickedEvenNumber) {
    emailForm.hidden = false;
    emailSent.hidden = true;
    emailForm.reset();
    updateEmailSubmitState();
    showPage(successPage, "#accepted");
    return;
  }

  showPage(failurePage, "#declined");
}

landingJoinButton.addEventListener("click", (event) => {
  event.preventDefault();
  showForm();
});

numberInput.addEventListener("input", () => {
  numberInput.value = numberInput.value.replace(/\D/g, "");
  updateSubmitState();
});

form.addEventListener("input", updateSubmitState);
form.addEventListener("change", updateSubmitState);
form.addEventListener("submit", (event) => {
  event.preventDefault();
  showResult();
});

emailForm.addEventListener("input", updateEmailSubmitState);
emailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!emailForm.checkValidity()) {
    updateEmailSubmitState();
    return;
  }

  emailForm.hidden = true;
  emailSent.hidden = false;
  history.replaceState(null, "", "#accepted-sent");
});

if (window.location.hash === "#join-form") {
  showForm();
} else if (window.location.hash === "#accepted") {
  showPage(successPage, "#accepted");
} else if (window.location.hash === "#accepted-sent") {
  emailForm.hidden = true;
  emailSent.hidden = false;
  showPage(successPage, "#accepted-sent");
} else if (window.location.hash === "#declined") {
  showPage(failurePage, "#declined");
}

updateSubmitState();
updateEmailSubmitState();
