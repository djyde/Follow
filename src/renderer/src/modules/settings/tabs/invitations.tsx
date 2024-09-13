import { Avatar, AvatarFallback, AvatarImage } from "@renderer/components/ui/avatar"
import { Button } from "@renderer/components/ui/button"
import { CopyButton } from "@renderer/components/ui/code-highlighter"
import { Divider } from "@renderer/components/ui/divider"
import { LoadingCircle } from "@renderer/components/ui/loading"
import { useModalStack } from "@renderer/components/ui/modal"
import { ScrollArea } from "@renderer/components/ui/scroll-area"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@renderer/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from "@renderer/components/ui/tooltip"
import { useAuthQuery } from "@renderer/hooks/common"
import { apiClient } from "@renderer/lib/api-fetch"
import { toastFetchError } from "@renderer/lib/error-parser"
import { usePresentUserProfileModal } from "@renderer/modules/profile/hooks"
import { Queries } from "@renderer/queries"
import { useMutation } from "@tanstack/react-query"
import dayjs from "dayjs"
import { Trans, useTranslation } from "react-i18next"
import { toast } from "sonner"

export const SettingInvitations = () => {
  const { t } = useTranslation()
  const invitations = useAuthQuery(Queries.invitations.list())

  const { present } = useModalStack()
  const presentUserProfile = usePresentUserProfileModal("drawer")

  return (
    <section className="mt-4">
      <div className="mb-4 space-y-2 text-sm">
        <Trans i18nKey="settings:invitation.earlyAccess">
          Follow is currently in <strong>early access</strong> and requires an invitation code to
          use.
        </Trans>
        <p className="flex items-center">
          <Trans
            components={{
              PowerIcon: <i className="i-mgc-power ml-1 mr-0.5 text-base text-accent" />,
            }}
            i18nKey="settings:invitation.generateCost"
          >
            <span>You can spend 10 </span>
            <i className="i-mgc-power ml-1 mr-0.5 text-base text-accent" />
            <span> Power to generate an invitation code for your friends.</span>
          </Trans>
        </p>
      </div>
      <Button
        onClick={() => {
          present({
            title: t("settings:invitation.confirmModal.title"),
            content: ({ dismiss }) => <ConfirmModalContent dismiss={dismiss} />,
          })
        }}
      >
        <i className="i-mgc-heart-hand-cute-re mr-1" />
        {t("settings:invitation.generateButton")}
      </Button>
      <Divider className="mb-6 mt-8" />
      <div className="flex flex-1 flex-col">
        <ScrollArea.ScrollArea viewportClassName="max-h-[380px]">
          {invitations.data?.length ? (
            <Table className="mt-4">
              <TableHeader className="border-b">
                <TableRow className="[&_*]:!font-semibold">
                  <TableHead className="w-16 text-center" size="sm">
                    {t("settings:invitation.tableHeaders.code")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("settings:invitation.tableHeaders.creationTime")}
                  </TableHead>
                  <TableHead className="text-center" size="sm">
                    {t("settings:invitation.tableHeaders.usedBy")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="border-t-[12px] border-transparent">
                {invitations.data?.map((row) => (
                  <TableRow key={row.code} className="h-8">
                    <TableCell align="center" size="sm">
                      <div className="group relative flex items-center justify-center gap-2 font-mono">
                        <span className="shrink-0">{row.code}</span>
                        <CopyButton
                          value={row.code}
                          className="absolute -right-6 p-1 opacity-0 group-hover:opacity-100 [&_i]:size-3"
                        />
                      </div>
                    </TableCell>
                    <TableCell align="center" className="tabular-nums" size="sm">
                      {row.createdAt && dayjs(row.createdAt).format("ll")}
                    </TableCell>
                    <TableCell align="center" size="sm">
                      {row.users ? (
                        <Tooltip>
                          <TooltipTrigger>
                            <button
                              type="button"
                              className="cursor-pointer"
                              onClick={() => {
                                presentUserProfile(row.users?.id)
                              }}
                            >
                              <Avatar className="aspect-square size-5 border border-border ring-1 ring-background">
                                <AvatarImage src={row.users?.image || undefined} />
                                <AvatarFallback>{row.users?.name?.slice(0, 2)}</AvatarFallback>
                              </Avatar>
                            </button>
                          </TooltipTrigger>
                          {row.users?.name && (
                            <TooltipPortal>
                              <TooltipContent>{row.users?.name}</TooltipContent>
                            </TooltipPortal>
                          )}
                        </Tooltip>
                      ) : (
                        t("settings:invitation.notUsed")
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : invitations.isLoading ? (
            <LoadingCircle size="large" className="center absolute inset-0" />
          ) : (
            <div className="mt-36 w-full text-center text-sm text-zinc-400">
              <p>{t("settings:invitation.noInvitations")}</p>
            </div>
          )}
        </ScrollArea.ScrollArea>
      </div>
    </section>
  )
}

const ConfirmModalContent = ({ dismiss }: { dismiss: () => void }) => {
  const { t } = useTranslation()
  const newInvitation = useMutation({
    mutationKey: ["newInvitation"],
    mutationFn: () => apiClient.invitations.new.$post(),
    async onError(err) {
      toastFetchError(err)
    },
    onSuccess(data) {
      Queries.invitations.list().invalidate()
      toast(t("settings:invitation.newInvitationSuccess"))
      navigator.clipboard.writeText(data.data)
      dismiss()
    },
  })

  return (
    <>
      <div className="flex items-center">
        <Trans
          components={{
            PowerIcon: <i className="i-mgc-power mx-1 text-base text-accent" />,
            div: <div />,
          }}
          i18nKey="settings:invitation.confirmModal.message"
        >
          <span>Generating an invitation code will cost you 10 </span>
          <i className="i-mgc-power mx-1 text-base text-accent" />
          <span>Power</span>
        </Trans>
      </div>
      <div>{t("settings:invitation.confirmModal.confirm")}</div>
      <div className="mt-4 flex items-center justify-end gap-3">
        <Button variant="outline" onClick={dismiss}>
          {t("settings:invitation.confirmModal.cancel")}
        </Button>
        <Button isLoading={newInvitation.isPending} onClick={() => newInvitation.mutate()}>
          {t("settings:invitation.confirmModal.continue")}
        </Button>
      </div>
    </>
  )
}
