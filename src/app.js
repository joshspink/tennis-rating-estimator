import React, { useMemo, useState } from "https://esm.sh/react@18.3.1";
import { createRoot } from "https://esm.sh/react-dom@18.3.1/client";

const h = React.createElement;

const DOUBLES_CONFIG = {
  Adult: {
    opponentsWeight: 0.5156,
    partnerWeight: -0.5002,
    marginWeight: 0.5616,
    currentWeight: 0.4795,
    intercept: -0.0431,
    neutralCurrent: 3.5093,
    blend: 0.26,
  },
  Mixed: {
    opponentsWeight: 0.4367,
    partnerWeight: -0.4409,
    marginWeight: 0.5556,
    currentWeight: 0.4959,
    intercept: 0.2606,
    neutralCurrent: 3.5996,
    blend: 0.14,
  },
};

const SINGLES_CONFIG = {
  opponentWeight: 0.9686,
  marginWeight: 0.5326,
  intercept: 0.1087,
  neutralCurrent: 3.4333,
  blend: 0.21,
};

function parseRating(value, label, errors, required = true) {
  if (!value.trim()) {
    if (required) errors.push(`${label} is required.`);
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    errors.push(`${label} must be a number.`);
    return null;
  }
  return parsed;
}

function parseScore(score, result) {
  const sets = score.trim().split(/\s+/).filter(Boolean);
  if (!sets.length) {
    throw new Error("Score is required.");
  }

  let winnerGames = 0;
  let loserGames = 0;
  for (const setScore of sets) {
    const match = setScore.match(/^(\d+)-(\d+)$/);
    if (!match) {
      throw new Error("Use scores like 6-4 3-6 1-0.");
    }
    winnerGames += Number(match[1]);
    loserGames += Number(match[2]);
  }

  return result === "W"
    ? { userGames: winnerGames, opponentGames: loserGames }
    : { userGames: loserGames, opponentGames: winnerGames };
}

function estimate(values) {
  const errors = [];
  const format = values.format;
  const matchType = values.matchType;
  const currentConfig = format === "Singles" ? SINGLES_CONFIG : DOUBLES_CONFIG[matchType];
  const currentRating =
    parseRating(values.currentRating, "Current rating", errors, false) ?? currentConfig.neutralCurrent;
  const { userGames, opponentGames } = parseScore(values.score, values.result);
  const totalGames = userGames + opponentGames;
  const margin = totalGames === 0 ? 0 : (userGames - opponentGames) / totalGames;

  let matchRating;
  if (format === "Singles") {
    const opponent = parseRating(values.opponentOne, "Opponent rating", errors);
    if (!errors.length) {
      matchRating =
        currentConfig.opponentWeight * opponent +
        currentConfig.marginWeight * margin +
        currentConfig.intercept;
    }
  } else {
    const partner = parseRating(values.partner, "Partner rating", errors);
    const opponentOne = parseRating(values.opponentOne, "Opponent 1 rating", errors);
    const opponentTwo = parseRating(values.opponentTwo, "Opponent 2 rating", errors);
    if (!errors.length) {
      matchRating =
        currentConfig.opponentsWeight * (opponentOne + opponentTwo) +
        currentConfig.partnerWeight * partner +
        currentConfig.marginWeight * margin +
        currentConfig.currentWeight * currentRating +
        currentConfig.intercept;
    }
  }

  if (errors.length) {
    return { errors };
  }

  const dynamicRating = currentRating * (1 - currentConfig.blend) + matchRating * currentConfig.blend;
  return {
    errors: [],
    currentRating,
    matchRating,
    dynamicRating,
    margin,
    userGames,
    opponentGames,
    blend: currentConfig.blend,
    usedNeutralCurrent: !values.currentRating.trim(),
  };
}

function Field({ label, value, onChange, placeholder, disabled = false }) {
  return h(
    "label",
    { className: disabled ? "field disabled" : "field" },
    h("span", null, label),
    h("input", {
      value,
      onChange: (event) => onChange(event.target.value),
      placeholder,
      disabled,
      inputMode: "decimal",
    }),
  );
}

function Segment({ options, value, onChange, label }) {
  return h(
    "div",
    { className: "segmentGroup", "aria-label": label },
    options.map((option) =>
      h(
        "button",
        {
          key: option,
          type: "button",
          className: option === value ? "segment active" : "segment",
          onClick: () => onChange(option),
        },
        option,
      ),
    ),
  );
}

function App() {
  const [values, setValues] = useState({
    format: "Doubles",
    matchType: "Adult",
    currentRating: "",
    partner: "",
    opponentOne: "",
    opponentTwo: "",
    result: "L",
    score: "",
  });

  const result = useMemo(() => {
    try {
      return estimate(values);
    } catch (error) {
      return { errors: [error.message] };
    }
  }, [values]);

  function update(key, value) {
    setValues((previous) => {
      const next = { ...previous, [key]: value };
      if (key === "matchType" && value === "Mixed") {
        next.format = "Doubles";
      }
      if (key === "format" && value === "Singles") {
        next.matchType = "Adult";
      }
      return next;
    });
  }

  const isSingles = values.format === "Singles";
  const formatOptions = values.matchType === "Mixed" ? ["Doubles"] : ["Doubles", "Singles"];
  const matchTypeOptions = isSingles ? ["Adult"] : ["Adult", "Mixed"];

  return h(
    "main",
    { className: "appShell" },
    h(
      "section",
      { className: "workspace" },
      h(
        "header",
        { className: "topBar" },
        h("div", null, h("h1", null, "Tennis Rating Estimator"), h("p", null, "Mock TennisRecord-style match and dynamic ratings")),
      ),
      h(
        "div",
        { className: "contentGrid" },
        h(
          "form",
          { className: "panel formPanel" },
          h("div", { className: "controlBlock" }, h("span", { className: "label" }, "Format"), h(Segment, {
            options: formatOptions,
            value: values.format,
            onChange: (next) => update("format", next),
            label: "Match format",
          })),
          h("div", { className: "controlBlock" }, h("span", { className: "label" }, "Match Type"), h(Segment, {
            options: matchTypeOptions,
            value: values.matchType,
            onChange: (next) => update("matchType", next),
            label: "Match type",
          })),
          h(
            "div",
            { className: "fieldGrid" },
            h(Field, {
              label: "Current rating",
              value: values.currentRating,
              onChange: (next) => update("currentRating", next),
              placeholder: "3.6889",
            }),
            h(Field, {
              label: isSingles ? "Opponent rating" : "Partner rating",
              value: isSingles ? values.opponentOne : values.partner,
              onChange: (next) => update(isSingles ? "opponentOne" : "partner", next),
              placeholder: isSingles ? "3.25" : "3.50",
            }),
            !isSingles &&
              h(Field, {
                label: "Opponent 1 rating",
                value: values.opponentOne,
                onChange: (next) => update("opponentOne", next),
                placeholder: "3.58",
              }),
            !isSingles &&
              h(Field, {
                label: "Opponent 2 rating",
                value: values.opponentTwo,
                onChange: (next) => update("opponentTwo", next),
                placeholder: "3.72",
              }),
          ),
          h(
            "div",
            { className: "matchRow" },
            h("div", { className: "controlBlock compact" }, h("span", { className: "label" }, "Result"), h(Segment, {
              options: ["W", "L"],
              value: values.result,
              onChange: (next) => update("result", next),
              label: "Result",
            })),
            h(Field, {
              label: "Score",
              value: values.score,
              onChange: (next) => update("score", next),
              placeholder: "Enter the score as shown for the winner, e.g. 6-3 3-6 1-0",
            }),
          ),
        ),
        h(
          "aside",
          { className: "panel resultPanel" },
          h("div", { className: "resultHeader" }, h("span", null, values.format), h("strong", null, values.matchType)),
          result.errors.length
            ? h("div", { className: "errors" }, result.errors.map((error) => h("p", { key: error }, error)))
            : h(
                React.Fragment,
                null,
                h(
                  "div",
                  { className: "metric primary" },
                  h("span", null, "Estimated match rating"),
                  h("strong", null, result.matchRating.toFixed(3)),
                  h("small", null, `Rounded: ${result.matchRating.toFixed(2)}`),
                ),
                h(
                  "div",
                  { className: "metric" },
                  h("span", null, "Post-match dynamic"),
                  h("strong", null, result.dynamicRating.toFixed(4)),
                  h("small", null, `Blend: ${(result.blend * 100).toFixed(0)}%`),
                ),
                h(
                  "dl",
                  { className: "details" },
                  h("div", null, h("dt", null, "Games"), h("dd", null, `${result.userGames}-${result.opponentGames}`)),
                  h("div", null, h("dt", null, "Margin"), h("dd", null, result.margin.toFixed(3))),
                  h("div", null, h("dt", null, "Current"), h("dd", null, result.currentRating.toFixed(4))),
                ),
                result.usedNeutralCurrent &&
                  h("p", { className: "note" }, "No current rating was entered, so a neutral calibration value was used."),
              ),
        ),
      ),
    ),
  );
}

createRoot(document.getElementById("root")).render(h(App));
