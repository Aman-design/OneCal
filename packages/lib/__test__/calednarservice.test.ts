import { Credential } from "@prisma/client";

import BaseCalendarService, { convertDate, getAttendees, getDuration } from "../CalendarService";
import { createCalendarObject } from "../__mocks__/tsdav";

test("convertDate should be able to convert date", () => {
  const convertedDate = convertDate("2019-01-01T06:30:30.000Z");
  expect(convertedDate).toStrictEqual([2019, 1, 1, 6, 30, 30]);
});

test("getDuration should be able to get duration from start and end time in minutes", () => {
  const duration = getDuration("2019-01-01T06:30:30.000Z", "2019-01-01T07:30:30.000Z");
  expect(duration).toStrictEqual({
    minutes: 60,
  });
});

test("getAttendees should be able to get attendees", () => {
  const attendees = getAttendees([
    {
      email: "bob@example.com",
      name: "bob",
      dir: "ltr",
    },
  ]);
  expect(attendees).toStrictEqual([
    {
      email: "bob@example.com",
      name: "bob",
      partstat: "NEEDS-ACTION",
    },
  ]);
});

class TestCalendarService extends BaseCalendarService {
  constructor(credential: Credential) {
    super(credential, "caldav_calendar", "https://caldav.example.com");
  }
}
describe("BaseCalendarService", () => {
  let instance: TestCalendarService;
  beforeAll(() => {
    instance = new TestCalendarService({
      id: 123,
      type: "caldav_calendar",
      key: "38034421d9c9060a1e3b7247d6ea854c:e9b26c9300ed6538096d868f283e2437f6b18509cf26fd43d72654837000d1ff6a3932a04721b8a7930c538e8163c513d8cc5e49bcff540c361c8865f1d440865cf8a82bbb89e14a31ea6417b5ee3d3a",
      userId: 123,
    });
  });

  test("createEvent should be able to create an event", async () => {
    const event = await instance.createEvent({
      startTime: "2019-01-01T06:30:30.000Z",
      endTime: "2019-01-01T07:30:30.000Z",
      title: "test",
      description: "test",
      location: "test",
      type: "test",
      organizer: {
        name: "alice",
        email: "alice@example.com",
        timeZone: "America/Los_Angeles",
        language: {
          translate: jest.fn(),
          locale: "en",
        },
      },
      attendees: [
        {
          name: "bob",
          email: "bob@example.com",
          timeZone: "America/Los_Angeles",
          language: {
            translate: jest.fn(),
            locale: "en",
          },
        },
      ],
    });

    expect(createCalendarObject).toHaveBeenCalledWith({
      calendar: {
        url: "https://caldav.example.com",
      },
      filename: `c69d70e8-4720-4519-9a8e-701a932bc8de.ics`,
      iCalString: `BEGIN:VCALENDAR
VERSION:2.0
CALSCALE:GREGORIAN
PRODID:adamgibbons/ics
X-PUBLISHED-TTL:PT1H
BEGIN:VEVENT
UID:c69d70e8-4720-4519-9a8e-701a932bc8de
SUMMARY:test
DTSTAMP:20220410T182900Z
DTSTART:20190101T063030Z
DESCRIPTION::\\ntest\\n  \\n\\nundefined:\\nAmerica/Los_Angeles\\n  \\n\\n
    undefined:\\n\\nalice - undefined\\nalice@example.com\\n  \\nbob\\nbob@example.c
    om\\n      \\n  \\nundefined:\\ntest\\n\\nundefined\\n    test\\n    \\n\\nundefined
    :\\nundefined\\n  \\n\\nundefined\\nhttp://localhost:3000/cancel/bQZN3Cy47ZtsnL
    GgH89PVY
LOCATION:test
ORGANIZER;CN=alice:mailto:alice@example.com
DURATION:PT60M
END:VEVENT
END:VCALENDAR`,
      headers: {
        Authorization: "Basic dXNlcjpwYXNzd29yZA==",
      },
    });

    expect(event).toStrictEqual({
      id: "123",
      start: "20190101T063000Z",
      end: "20190101T073000Z",
      summary: "test",
      description: "test",
      location: "test",
      organizer: {
        uid: "123",
        id: 123,
        type: "test",
        password: "",
        url: "",
        additionalInfo: {},
      },
    });
  });
});
