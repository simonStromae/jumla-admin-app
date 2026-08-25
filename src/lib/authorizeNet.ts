import ApiContracts from 'authorizenet/lib/apicontracts.js';
import ApiControllers from 'authorizenet/lib/apicontrollers.js';

const AUTHNET_ENDPOINT = {
  sandbox:    'https://apitest.authorize.net/xml/v1/request.api',
  production: 'https://api2.authorize.net/xml/v1/request.api',
};

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

export interface BillTo {
  firstName: string;
  lastName:  string;
  address:   string;
  city:      string;
  state:     string;
  zip:       string;
  country:   string;
}

// Credential check using the dedicated AuthenticateTest endpoint
export async function testCredentials(creds: AuthNetCredentials): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const merchantAuth = new ApiContracts.MerchantAuthenticationType();
      merchantAuth.setName(creds.loginId);
      merchantAuth.setTransactionKey(creds.transactionKey);

      const request = new ApiContracts.AuthenticateTestRequest();
      request.setMerchantAuthentication(merchantAuth);

      const controller = new ApiControllers.AuthenticateTestController(request.getJSON());
      controller.setEnvironment(
        creds.environment === 'production'
          ? AUTHNET_ENDPOINT.production
          : AUTHNET_ENDPOINT.sandbox
      );

      controller.execute(() => {
        try {
          const apiResponse = controller.getResponse();
          const response = new ApiContracts.AuthenticateTestResponse(apiResponse);
          if (!response || response.getMessages().getResultCode() !== ApiContracts.MessageTypeEnum.OK) {
            const msg = response?.getMessages()?.getMessage?.()?.[0];
            resolve({ ok: false, error: msg?.getText?.() ?? 'Identifiants invalides' });
            return;
          }
          resolve({ ok: true });
        } catch (e: any) {
          resolve({ ok: false, error: e?.message ?? 'Erreur lors de la réponse' });
        }
      });
    } catch (e: any) {
      resolve({ ok: false, error: e?.message ?? 'Erreur initialisation' });
    }
  });
}

export async function chargeOpaqueData(
  creds:       AuthNetCredentials,
  opaqueData:  { dataDescriptor: string; dataValue: string },
  amountCad:   number,
  description: string,
  billTo?:     BillTo,
): Promise<ChargeResult> {
  return new Promise((resolve) => {
    try {
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

    if (billTo) {
      const customerAddress = new ApiContracts.CustomerAddressType();
      customerAddress.setFirstName(billTo.firstName);
      customerAddress.setLastName(billTo.lastName);
      customerAddress.setAddress(billTo.address);
      customerAddress.setCity(billTo.city);
      customerAddress.setState(billTo.state);
      customerAddress.setZip(billTo.zip);
      customerAddress.setCountry(billTo.country);
      txRequest.setBillTo(customerAddress);
    }

    const request = new ApiContracts.CreateTransactionRequest();
    request.setMerchantAuthentication(merchantAuth);
    request.setTransactionRequest(txRequest);

    const controller = new ApiControllers.CreateTransactionController(request.getJSON());
    controller.setEnvironment(
      creds.environment === 'production'
        ? AUTHNET_ENDPOINT.production
        : AUTHNET_ENDPOINT.sandbox
    );

    controller.execute(() => {
      try {
        const apiResponse = controller.getResponse();
        const response = new ApiContracts.CreateTransactionResponse(apiResponse);

        if (!response || response.getMessages().getResultCode() !== ApiContracts.MessageTypeEnum.OK) {
          // Auth errors are in messages, not in transactionResponse.errors
          const msgErr = response?.getMessages()?.getMessage?.()?.[0];
          const txErr  = response?.getTransactionResponse()?.getErrors()?.getError()?.[0];
          resolve({ success: false, error: txErr?.getErrorText() ?? msgErr?.getText?.() ?? 'Transaction refusée' });
          return;
        }

        const txResponse = response.getTransactionResponse();
        if (!txResponse || txResponse.getResponseCode() !== '1') {
          const txErr  = txResponse?.getErrors()?.getError()?.[0];
          const msgErr = response?.getMessages()?.getMessage?.()?.[0];
          resolve({ success: false, error: txErr?.getErrorText() ?? msgErr?.getText?.() ?? 'Transaction refusée' });
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
    } catch (e: any) {
      resolve({ success: false, error: `SDK setup error: ${e?.message ?? e}` });
    }
  });
}
