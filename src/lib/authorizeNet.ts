import ApiContracts from 'authorizenet/lib/apicontracts.js';
import ApiControllers from 'authorizenet/lib/apicontrollers.js';
import Constants from 'authorizenet/lib/constants.js';

export interface AuthNetCredentials {
  loginId:        string;
  transactionKey: string;
  environment:    'sandbox' | 'production';
}

export interface ChargeResult {
  success:        boolean;
  transactionId?: string;
  authCode?:      string;
  last4?:         string;
  cardType?:      string;
  error?:         string;
}

export async function chargeOpaqueData(
  creds:       AuthNetCredentials,
  opaqueData:  { dataDescriptor: string; dataValue: string },
  amountCad:   number,
  description: string,
): Promise<ChargeResult> {
  return new Promise((resolve) => {
    const merchantAuth = new ApiContracts.MerchantAuthenticationType();
    merchantAuth.setName(creds.loginId);
    merchantAuth.setTransactionKey(creds.transactionKey);

    const opaque = new ApiContracts.OpaqueDataType();
    opaque.setDataDescriptor(opaqueData.dataDescriptor);
    opaque.setDataValue(opaqueData.dataValue);

    const payment = new ApiContracts.PaymentType();
    payment.setOpaqueData(opaque);

    const txRequest = new ApiContracts.TransactionRequestType();
    txRequest.setTransactionType(ApiContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    txRequest.setAmount(amountCad.toFixed(2));
    txRequest.setPayment(payment);
    txRequest.setDescription(description.substring(0, 255));

    const request = new ApiContracts.CreateTransactionRequest();
    request.setMerchantAuthentication(merchantAuth);
    request.setTransactionRequest(txRequest);

    const controller = new ApiControllers.CreateTransactionController(request.getJSON());
    controller.setEnvironment(
      creds.environment === 'production'
        ? Constants.endpoint.production
        : Constants.endpoint.sandbox
    );

    controller.execute(() => {
      try {
        const apiResponse = controller.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (!response || response.getMessages().getResultCode() !== ApiContracts.MessageTypeEnum.OK) {
          const err = response?.getTransactionResponse()?.getErrors()?.getError()?.[0];
          resolve({ success: false, error: err?.getErrorText() ?? 'Transaction refusée' });
          return;
        }

        const txResponse = response.getTransactionResponse();
        if (!txResponse || txResponse.getResponseCode() !== '1') {
          const err = txResponse?.getErrors()?.getError()?.[0];
          resolve({ success: false, error: err?.getErrorText() ?? 'Transaction refusée' });
          return;
        }

        resolve({
          success:       true,
          transactionId: txResponse.getTransId(),
          authCode:      txResponse.getAuthCode(),
          last4:         txResponse.getAccountNumber()?.slice(-4),
          cardType:      txResponse.getAccountType(),
        });
      } catch (e: any) {
        resolve({ success: false, error: e?.message ?? 'Erreur serveur' });
      }
    });
  });
}
