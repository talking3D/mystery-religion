const landing = document.querySelector(".landing");
const formPage = document.querySelector(".form-page");
const landingJoinButton = document.querySelector(".join-button");
const form = document.querySelector(".join-form");
const submitButton = document.querySelector(".form-submit");
const numberInput = document.querySelector("#lucky-number");

function showForm() {
  landing.hidden = true;
  formPage.hidden = false;
  window.scrollTo({ top: 0, left: 0 });
  history.replaceState(null, "", "#join-form");
}

function updateSubmitState() {
  submitButton.disabled = !form.checkValidity();
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
});

if (window.location.hash === "#join-form") {
  showForm();
}

updateSubmitState();
