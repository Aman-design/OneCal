import { nameOfDay, weekdayNames } from "./weekday";

describe("Weekday tests", () => {
  describe("fn: weekdayNames", () => {
    it("should return the weekday names for a given locale", () => {
      const locales = ["en-US", "en-CA", "en-GB", "en-AU"];

      for (const locale of locales) {
        const result = weekdayNames(locale);

        const expected = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

        expect(result).toEqual(expected);
      }
    });

    it("should return the weekday names for a given locale and format", () => {
      const locales = ["en-US", "en-CA", "en-GB", "en-AU"];

      for (const locale of locales) {
        const result = weekdayNames(locale, 0, "short");

        const expected = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

        expect(result).toEqual(expected);
      }
    });

    it("should return the weekday names for a given locale and week start offset", () => {
      const locales = ["en-US", "en-CA", "en-GB", "en-AU"];

      for (const locale of locales) {
        const result = weekdayNames(locale, 1);

        const expected = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

        expect(result).toEqual(expected);
      }
    });
  });

  describe("fn: nameOfDay", () => {
    it("should return the name of the day for a given locale", () => {
      const locales = ["en-US", "en-CA", "en-GB", "en-AU"];
      const days = [
        { day: 0, expected: "Sunday" },
        { day: 1, expected: "Monday" },
        { day: 2, expected: "Tuesday" },
        { day: 3, expected: "Wednesday" },
        { day: 4, expected: "Thursday" },
        { day: 5, expected: "Friday" },
        { day: 6, expected: "Saturday" },
      ];

      for (const locale of locales) {
        for (const { day, expected } of days) {
          const result = nameOfDay(locale, day);

          expect(result).toEqual(expected);
        }
      }
    });
  });
});
