import { useState } from "react";

import { useLocale } from "@calcom/lib/hooks/useLocale";
import Button from "@calcom/ui/Button";

import { ConfirmDialog } from "./confirmDialog";

interface IWipeMyCalActionButtonProps {
  trpc: any;
}

const WipeMyCalActionButton = (props: IWipeMyCalActionButtonProps) => {
  const { trpc } = props;
  const { t } = useLocale();
  const [openDialog, setOpenDialog] = useState(false);
  const { isSuccess, isLoading, data } = trpc.useQuery(["viewer.integrations"]);

  return (
    <div>
      {data &&
        isSuccess &&
        !isLoading &&
        data?.other?.items.find((item: { type: string }) => item.type === "wipemycal_other") && (
          <>
            <ConfirmDialog trpc={trpc} isOpenDialog={openDialog} setIsOpenDialog={setOpenDialog} />
            <Button onClick={() => setOpenDialog(true)}>{t("wipe_my_cal_text_button")}</Button>
          </>
        )}
    </div>
  );
};

export { WipeMyCalActionButton };
