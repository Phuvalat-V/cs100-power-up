
function validatePortfolioItem(data) {
  // 1. Validate required fields
  const required = [
    "title",
    "type",
    "date",
    "role",
    "description"
  ];

  for (const field of required) {
    if (
      typeof data[field] !== "string" ||
      !data[field].trim()
    ) {
      return `Please enter ${field}.`;
    }
  }

  // 2. Validate date (YYYY-MM-DD)
  const date = data.date.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return "Please enter a valid date.";
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const parsed = new Date(0);
  parsed.setFullYear(year, month - 1, day);

  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return "Please enter a valid date.";
  }

  // 3. Validate skills
  if (
    !Array.isArray(data.skills) ||
    data.skills.length === 0 ||
    data.skills.some(
      skill => typeof skill !== "string" || !skill.trim()
    )
  ) {
    return "Please enter at least one skill.";
  }

  // 4. Validate reflection
  const reflectionFields = [
    "whatIDid",
    "whatILearned",
    "challenge",
    "nextStep"
  ];

  for (const field of reflectionFields) {
    if (
      !data.reflection ||
      typeof data.reflection[field] !== "string" ||
      !data.reflection[field].trim()
    ) {
      return `Please complete reflection: ${field}.`;
    }
  }

  // 5. Validate evidence URLs
  if (
    !Array.isArray(data.evidence) ||
    data.evidence.length === 0
  ) {
    return "Please enter at least one evidence URL.";
  }

  for (const link of data.evidence) {
    try {
      const url = new URL(link);

      if (
        !["https:", "http:"].includes(url.protocol) ||
        !url.hostname.includes(".")
      ) {
        return `Invalid evidence URL: ${link}`;
      }
    } catch {
      return `Invalid evidence URL: ${link}`;
    }
  }

  // All validations passed
  return null;
}
