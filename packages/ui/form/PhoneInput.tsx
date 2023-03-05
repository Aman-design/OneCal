import { isSupportedCountry } from "libphonenumber-js";
import { useEffect, useState } from "react";
import BasePhoneInput from "react-phone-number-input";
import type { Props, Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

import cn from "@calcom/lib/classNames";

export type PhoneInputProps = Props<{
  value: string;
  id?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
}>;

function PhoneInput({ name, className = "", onChange, ...rest }: PhoneInputProps) {
  const defaultCountry = useDefaultCountry();

  return (
    <BasePhoneInput
      {...rest}
      international
      defaultCountry={defaultCountry}
      name={name}
      onChange={onChange}
      countrySelectProps={{ className: "text-black" }}
      numberInputProps={{
        className:
          "border-0 text-sm focus:ring-0 dark:bg-darkgray-100 dark:placeholder:text-darkgray-600 rounded-lg",
      }}
      className={cn(
        "focus-within:border-brand dark:bg-darkgray-100 dark:border-darkgray-300 block w-full rounded-md border border border-gray-300 py-px pl-3 ring-black focus-within:ring-1 disabled:text-gray-500 disabled:opacity-50 dark:text-white dark:selection:bg-green-500 disabled:dark:text-gray-500",
        className
      )}
    />
  );
}

const useDefaultCountry = () => {
  const [defaultCountry, setDefaultCountry] = useState<Country>("US");
  useEffect(() => {
    fetch("/api/countrycode")
      .then((res) => res.json())
      .then((res) => {
        if (isSupportedCountry(res.countryCode)) setDefaultCountry(res.countryCode);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return defaultCountry;
};

export default PhoneInput;
