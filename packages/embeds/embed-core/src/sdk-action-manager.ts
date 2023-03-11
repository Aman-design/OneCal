type Namespace = string;
type CustomEventDetail = Record<string, unknown>;

function _fireEvent(fullName: string, detail: CustomEventDetail) {
  const event = new window.CustomEvent(fullName, {
    detail: detail,
  });

  window.dispatchEvent(event);
}

type EventDataMap = {
  __dimensionChanged: {
    iframeHeight: number;
    iframeWidth: number;
    isFirstTime: boolean;
  };
  eventTypeSelected: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    eventType: any;
  };
  linkFailed: {
    code: string;
    msg: string;
    data: {
      url: string;
    };
  };
  __routeChanged: Record<string, never>;
  linkReady: Record<string, never>;
  __windowLoadComplete: Record<string, never>;
  __closeIframe: Record<string, never>;
  __iframeReady: Record<string, never>;
};

type EventData<T extends keyof EventDataMap> = {
  [K in T]: {
    type: string;
    namespace: string;
    fullType: string;
    data: EventDataMap[K];
  };
}[T];

export class SdkActionManager {
  namespace: Namespace;

  static parseAction(fullType: string) {
    if (!fullType) {
      return null;
    }
    //FIXME: Ensure that any action if it has :, it is properly encoded.
    const [cal, calNamespace, type] = fullType.split(":");
    if (cal !== "CAL") {
      return null;
    }
    return {
      ns: calNamespace,
      type,
    };
  }

  getFullActionName(name: string) {
    return this.namespace ? `CAL:${this.namespace}:${name}` : `CAL::${name}`;
  }

  fire(name: "__dimensionChanged", data: EventDataMap["__dimensionChanged"]): void;
  fire(name: "__routeChanged", data: EventDataMap["__routeChanged"]): void;
  fire(name: "__closeIframe", data: EventDataMap["__closeIframe"]): void;
  fire(name: "__iframeReady", data: EventDataMap["__iframeReady"]): void;

  fire(name: "eventTypeSelected", data: EventDataMap["eventTypeSelected"]): void;
  fire(name: "linkFailed", data: EventDataMap["linkFailed"]): void;
  fire(name: "linkReady", data: EventDataMap["linkReady"]): void;
  fire(name: "__windowLoadComplete", data: EventDataMap["__windowLoadComplete"]): void;

  fire(name: string, data: CustomEventDetail) {
    const fullName = this.getFullActionName(name);
    const detail = {
      type: name,
      namespace: this.namespace,
      fullType: fullName,
      data,
    };

    _fireEvent(fullName, detail);

    // Wildcard Event
    _fireEvent(this.getFullActionName("*"), detail);
  }

  on(
    name: "__dimensionChanged",
    callback: (arg0: CustomEvent<EventData<"__dimensionChanged">>) => void
  ): void;
  on(name: "__routeChanged", callback: (arg0: CustomEvent<EventData<"__routeChanged">>) => void): void;
  on(name: "__closeIframe", callback: (arg0: CustomEvent<EventData<"__closeIframe">>) => void): void;
  on(name: "__iframeReady", callback: (arg0: CustomEvent<EventData<"__iframeReady">>) => void): void;
  on(name: "eventTypeSelected", callback: (arg0: CustomEvent<EventData<"eventTypeSelected">>) => void): void;
  on(name: "linkFailed", callback: (arg0: CustomEvent<EventData<"linkFailed">>) => void): void;
  on(name: "linkReady", callback: (arg0: CustomEvent<EventData<"linkReady">>) => void): void;
  on(
    name: "__windowLoadComplete",
    callback: (arg0: CustomEvent<EventData<"__windowLoadComplete">>) => void
  ): void;
  on(name: "*", callback: (arg0: CustomEvent<unknown>) => void): void;

  on(name: string, callback: (arg0: CustomEvent<never>) => void) {
    const fullName = this.getFullActionName(name);
    window.addEventListener(fullName, callback as EventListener);
  }

  off(
    name: "__dimensionChanged",
    callback: (arg0: CustomEvent<EventData<"__dimensionChanged">>) => void
  ): void;
  off(name: "__routeChanged", callback: (arg0: CustomEvent<EventData<"__routeChanged">>) => void): void;
  off(name: "__closeIframe", callback: (arg0: CustomEvent<EventData<"__closeIframe">>) => void): void;
  off(name: "__iframeReady", callback: (arg0: CustomEvent<EventData<"__iframeReady">>) => void): void;

  off(name: "eventTypeSelected", callback: (arg0: CustomEvent<EventData<"eventTypeSelected">>) => void): void;
  off(name: "linkFailed", callback: (arg0: CustomEvent<EventData<"linkFailed">>) => void): void;
  off(name: "linkReady", callback: (arg0: CustomEvent<EventData<"linkReady">>) => void): void;

  off(name: string, callback: (arg0: CustomEvent<never>) => void) {
    const fullName = this.getFullActionName(name);
    window.removeEventListener(fullName, callback as EventListener);
  }

  constructor(ns: string | null) {
    ns = ns || "";
    this.namespace = ns;
  }
}
