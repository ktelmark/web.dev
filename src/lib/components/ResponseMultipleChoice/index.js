import {html} from "lit-element";
import {BaseResponseElement} from "../BaseResponseElement";
import "../SelectGroup";

/* eslint-disable require-jsdoc */
class ResponseMultipleChoice extends BaseResponseElement {
  static get properties() {
    return {
      cardinality: {type: String},
      columns: {type: Boolean},
      correctAnswer: {attribute: "correct-answer"},
    };
  }

  constructor() {
    super();
    this.prerenderedChildren = null;
    this.optionContents = null;
    this.rationales = null;
    this.minSelections = null;
    this.maxSelections = null;

    this.onOptionInput = this.onOptionInput.bind(this);
    this.deselectOption = this.deselectOption.bind(this);
    this.updateSelections = this.updateSelections.bind(this);
  }

  render() {
    const options = [];
    const correctArr = this.correctAnswer.split(",").map(Number);
    const selectType = this.cardinality === "1" ? "radio" : "checkbox";
    const selectionRange = BaseResponseElement.getSelectionRange(
      this.cardinality,
    );

    this.minSelections = selectionRange.min;
    this.maxSelections = selectionRange.max;

    if (!this.prerenderedChildren) {
      this.prerenderedChildren = [];
      this.optionContents = [];
      this.rationales = [];

      for (const child of this.children) {
        const role = child.getAttribute("data-role");

        switch (role) {
          case "option":
            this.optionContents.push(child);
            break;
          case "rationale":
            this.rationales.push(child);
            break;
          default:
            this.prerenderedChildren.push(child);
        }
      }

      for (let i = 0; i < this.optionContents.length; i++) {
        const isCorrect = correctArr.includes(i);

        options.push(
          this.optionTemplate(
            this.optionContents[i],
            this.rationales[i],
            isCorrect,
          ),
        );
      }
    }

    return html`
      ${this.prerenderedChildren}
      <web-select-group
        type="${selectType}"
        prefix="web-response-mc"
        ?columns="${this.columns}"
      >
        ${options}
      </web-select-group>
    `;
  }

  optionTemplate(content, rationale, isCorrect) {
    const flag = document.createElement("div");

    flag.className = "web-response__correctness-flag";
    if (isCorrect) {
      flag.innerHTML = "Correct";
    } else {
      flag.innerHTML = "Incorrect";
    }
    content.prepend(flag);
    rationale.className = "web-response__option-rationale";
    content.append(rationale);

    // Remove data-role since it's being handled by the SelectGroup component.
    content.removeAttribute("data-role");

    return content;
  }

  firstUpdated() {
    super.firstUpdated();
    // Wait for the SelectGroup component to be upgraded
    // and then add a click event listener to each option.
    // Source: https://github.com/kenchris/lit-element#element-upgrading
    customElements.whenDefined("web-select-group").then(() => {
      const options = this.querySelectorAll("input");

      for (const option of options) {
        option.addEventListener("input", this.onOptionInput);
      }
    });
  }

  onOptionInput(e) {
    this.updateSelections(e);
    this.enforceCardinality(e);
  }

  updateSelections(e) {
    const options = this.querySelectorAll("[data-role=option]");
    const currentOption = e.target.closest("[data-role=option]");

    if (e.target.checked) {
      if (this.cardinality === "1") {
        for (const option of options) {
          option.removeAttribute("data-selected");
        }
      }
      currentOption.setAttribute("data-selected", "");
    } else {
      currentOption.removeAttribute("data-selected");
    }
  }

  // Helper function to allow BaseResponseElement to deselect options as needed.
  deselectOption(option) {
    option.removeAttribute("data-selected");
    option.querySelector("input").checked = false;
  }
}

customElements.define("web-response-mc", ResponseMultipleChoice);