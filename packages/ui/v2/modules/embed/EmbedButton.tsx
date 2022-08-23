import { useRouter } from "next/router";

import { classNames } from "@calcom/lib";

import { Button } from "../../core";

type EmbedButtonProps<T> = {
  embedUrl: string;
  children?: React.ReactNode;
  className?: string;
  as?: T;
};

export const EmbedButton = <T extends React.ElementType>({
  embedUrl,
  children,
  className = "",
  as,
  ...props
}: EmbedButtonProps<T> & React.ComponentPropsWithoutRef<T>) => {
  const router = useRouter();
  className = classNames(className);
  const openEmbedModal = () => {
    const query = {
      ...router.query,
      dialog: "embed",
      embedUrl,
    };
    router.push(
      {
        pathname: router.pathname,
        query,
      },
      undefined,
      { shallow: true }
    );
  };
  const Component = as ?? Button;

  return (
    <Component
      {...props}
      className={className}
      data-test-embed-url={embedUrl}
      data-testid="embed"
      onClick={() => openEmbedModal()}>
      {children}
    </Component>
  );
};
