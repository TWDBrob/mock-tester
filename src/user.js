import AWS from "aws-sdk";
import {
    CognitoUser,
    CognitoUserPool,
    AuthenticationDetails,
    CognitoUserAttribute,
} from "amazon-cognito-identity-js";
import keys from "../keys";

// these functions are for accessing the user in the
// user pool as well as storing credentials from the
// identity pool, using the amazon-cognito-identity-js
// package of AWS Amplify as well as Cognito Sync
// the user object is stored as a global since you
// aren't supposed to store non-serializable objects
// in Redux

const appConfig = { ...keys.awsConfig };

AWS.config.region = appConfig.region;

const datasetName = "texasflood";

const userPool = new CognitoUserPool({
    UserPoolId: appConfig.UserPoolId,
    ClientId: appConfig.ClientId,
});

let cognitoUser = null;

export const retrieveLoggedInUserAfterRefresh = () => {
    return new Promise((resolve, reject) => {
        cognitoUser = userPool.getCurrentUser();
        if (!cognitoUser) {
            resolve(null);
            return;
        }
        cognitoUser.getSession((err, session) => {
            if (err || !session.isValid) {
                reject();
            } else {
                const idToken = session.getIdToken();
                setAWSCredentials(idToken.getJwtToken())
                    .then(() => {
                        resolve(idToken);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            }
        });
    });
};

const getNewCognitoUser = (username) => {
    const userData = {
        Username: username,
        Pool: userPool,
    };
    return new CognitoUser(userData);
};

const setAWSCredentials = (jwt) => {
    return new Promise((resolve, reject) => {
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
            IdentityPoolId: appConfig.IdentityPoolId,
            Logins: {
                [appConfig.Logins.cognito.identityProviderName]: jwt,
            },
        });
        AWS.config.credentials.clearCachedId();
        AWS.config.credentials.refresh((err) => {
            err ? reject(err) : resolve();
        });
    });
};

export const authenticate = (username, password) => {
    const authenticationDetails = new AuthenticationDetails({
        Username: username,
        Password: password,
    });

    cognitoUser = getNewCognitoUser(username);

    return new Promise((resolve, reject) => {
        cognitoUser.authenticateUser(authenticationDetails, {
            onSuccess: function (result) {
                setAWSCredentials(result.idToken.jwtToken)
                    .then(() => {
                        resolve(result);
                    })
                    .catch((err) => {
                        reject(err);
                    });
            },
            onFailure: function (err) {
                reject(err);
            },
            newPasswordRequired: function (userAttributes, requiredAttributes) {
                reject({
                    code: "PasswordResetRequiredException",
                    message: "New Password Required",
                    newPasswordRequired: true,
                });
            },
        });
    });
};

export const updateAlerts = (current, predictive) => {
    return new Promise((resolve, reject) => {
        if (!cognitoUser) reject("no cognitoUser value");

        const currentAlertAttribute = new CognitoUserAttribute({
            Name: "custom:currentAlerts",
            Value: current ? "T" : "F",
        });
        const predictiveAlertAttribute = new CognitoUserAttribute({
            Name: "custom:predictiveAlerts",
            Value: predictive ? "T" : "F",
        });

        cognitoUser.updateAttributes(
            [currentAlertAttribute, predictiveAlertAttribute],
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }
        );
    });
};

export const logout = () => {
    return new Promise((resolve, reject) => {
        if (!cognitoUser) reject("no cognitoUser value");

        cognitoUser.globalSignOut({
            onSuccess: () => {
                resolve();
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
};

export const signUp = (username, password, email, phone) => {
    return new Promise((resolve, reject) => {
        const userAttributes = [];
        userAttributes.push(
            new CognitoUserAttribute({
                Name: "email",
                Value: email,
            })
        );

        if (phone && phone.length) {
            userAttributes.push(
                new CognitoUserAttribute({
                    Name: "phone_number",
                    Value: "+1" + phone,
                })
            );
        }

        userAttributes.push(
            new CognitoUserAttribute({
                Name: "custom:currentAlerts",
                Value: "T",
            })
        );

        userAttributes.push(
            new CognitoUserAttribute({
                Name: "custom:predictiveAlerts",
                Value: "T",
            })
        );

        userPool.signUp(
            username,
            password,
            userAttributes,
            null,
            (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    cognitoUser = result.user;
                    resolve(result);
                }
            }
        );
    });
};

export const confirmCode = (code) => {
    return new Promise((resolve, reject) => {
        cognitoUser.confirmRegistration(code, true, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const resendCode = () => {
    return new Promise((resolve, reject) => {
        cognitoUser.resendConfirmationCode((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};

export const forgotPassword = (username) => {
    return new Promise((resolve, reject) => {
        cognitoUser = getNewCognitoUser(username);
        cognitoUser.forgotPassword({
            onSuccess: (data) => {
                resolve(data);
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
};

export const updatePassword = (verificationCode, newPassword) => {
    return new Promise((resolve, reject) => {
        cognitoUser.confirmPassword(verificationCode, newPassword, {
            onSuccess: () => {
                resolve();
            },
            onFailure: (err) => {
                reject(err);
            },
        });
    });
};

export const deleteUser = () => {
    return new Promise((resolve, reject) => {
        cognitoUser.deleteUser((err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};
