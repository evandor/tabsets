export function useEmailTemplates() {
  const invitationSetup = (email: string, tabsetName: string, sharedBy: string, tabsToShare: object[]) => {
    return {
      from: [
        {
          email: 'carsten@skysail.io',
          name: 'Sender name',
        },
      ],
      to: [
        {
          email: email,
          name: email,
        },
      ],
      // message: {
      subject: 'Hello from Tabsets!',
      template_id: 'neqvygm5zj540p7w',
      // text: 'This is an TEXT email body.',
      //html: 'This is an <code>HTML</code> email body.',
      variables: [
        {
          email: email,
          substitutions: [
            {
              var: 'name',
              value: email,
            },
            {
              var: 'tabsetName',
              value: tabsetName,
            },
            {
              var: 'help_url',
              value: 'help_url',
            },
            {
              var: 'action_url',
              value: process.env.PWA_BACKEND_URL + '/#/invitation?email=' + email,
            },
            {
              var: 'account.name',
              value: 'accountname',
            },
            {
              var: 'live_chat_url',
              value: '',
            },
            {
              var: 'support_email',
              value: 'carsten@skysail.io',
            },
            {
              var: 'invite_sender_name',
              value: sharedBy,
            },
            {
              var: 'invite_sender_organization_name',
              value: 'Skysail',
            },
          ],
        },
      ],
      // https://developers.mailersend.com/api/v1/features.html#personalization
      personalization: [
        {
          email: email,
          data: {
            tabs: tabsToShare,
          },
        },
      ],
    }
  }

  return {
    invitationSetup,
  }
}
