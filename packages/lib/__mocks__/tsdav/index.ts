export const createCalendarObject = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
  })
);
export const getBasicAuthHeaders = () => ({
  Authorization: "Basic dXNlcjpwYXNzd29yZA==",
});

export const fetchCalendars = jest.fn(() =>
  Promise.resolve([
    {
      id: "123",
      name: "test",
      color: "red",
      description: "test",
      url: "https://caldav.example.com",
      ctag: "123",
      syncToken: "123",
      components: ["VEVENT", "VTODO"],
      timeZone: "America/Los_Angeles",
    },
  ])
);

export const createAccount = () => {
  return jest.fn(() => ({
    accountType: "caldav",
    serverUrl: "https://caldav.example.com",
  }));
};
