import * as Proteus from "wire-webapp-proteus";
import {CryptoboxStore} from "./CryptoboxStore";

export default class Cache implements CryptoboxStore {
  private identity: Proteus.keys.IdentityKeyPair;
  private prekeys: Object = {};
  private sessions: Object = {};

  constructor() {
  }

  public delete_all(): Promise<boolean> {
    return new Promise((resolve) => {
      this.identity = undefined;
      this.prekeys = {};
      this.sessions = {};
      resolve(true);
    });
  }

  public delete_prekey(prekey_id: number): Promise<string> {
    return new Promise((resolve) => {
      delete this.prekeys[prekey_id];
      resolve(prekey_id);
    });
  }

  public delete_session(session_id: string): Promise<string> {
    return new Promise((resolve) => {
      delete this.sessions[session_id];
      resolve(session_id);
    });
  }

  public load_identity(): Promise<Proteus.keys.IdentityKeyPair> {
    return new Promise((resolve, reject) => {
      if (this.identity) {
        resolve(this.identity);
      } else {
        reject(new Error(`No local identity present.`));
      }
    });
  }

  public load_prekey(prekey_id: number): Promise<Proteus.keys.PreKey> {
    return new Promise((resolve, reject) => {
      let serialised: ArrayBuffer = this.prekeys[prekey_id];
      if (serialised) {
        resolve(Proteus.keys.PreKey.deserialise(serialised));
      } else {
        reject(new Error(`PreKey with ID "${prekey_id}" not found.`));
      }
    });
  }

  public load_prekeys(): Promise<Array<Proteus.keys.PreKey>> {
    return new Promise((resolve) => {
      let all_prekeys: Array<Proteus.keys.PreKey> = Object.keys(this.prekeys).map((key: string) => {
        return this.prekeys[key];
      });

      resolve(all_prekeys);
    });
  }

  public load_session(identity: Proteus.keys.IdentityKeyPair, session_id: string): Promise<Proteus.session.Session> {
    return new Promise((resolve, reject) => {
      let serialised: ArrayBuffer = this.sessions[session_id];
      if (serialised) {
        resolve(Proteus.session.Session.deserialise(identity, serialised));
      } else {
        reject(new Error(`Session with ID "${session_id}" not found.`));
      }
    });
  }

  public save_identity(identity: Proteus.keys.IdentityKeyPair): Promise<Proteus.keys.IdentityKeyPair> {
    return new Promise((resolve) => {
      this.identity = identity;
      resolve(this.identity);
    });
  }

  public save_prekey(preKey: Proteus.keys.PreKey): Promise<Proteus.keys.PreKey> {
    return new Promise((resolve, reject) => {

      try {
        this.prekeys[preKey.key_id] = preKey.serialise();
      } catch (error) {
        // TODO: Keep (and log) error stack trace
        return reject(new Error(`PreKey (no. ${preKey.key_id}) serialization problem "${error.message}" at "${error.stack}".`));
      }

      resolve(preKey);
    });
  }

  save_prekeys(preKeys: Array<Proteus.keys.PreKey>): Promise<Array<Proteus.keys.PreKey>> {
    return new Promise((resolve, reject) => {
      let savePromises: Array<Promise<Proteus.keys.PreKey>> = [];

      preKeys.forEach((preKey: Proteus.keys.PreKey) => {
        savePromises.push(this.save_prekey(preKey));
      });

      Promise.all(savePromises).then(() => {
        resolve(preKeys);
      }).catch(reject);
    });
  }

  public save_session(session_id: string, session: Proteus.session.Session): Promise<Proteus.session.Session> {
    return new Promise((resolve, reject) => {

      try {
        this.sessions[session_id] = session.serialise();
      } catch (error) {
        return reject(new Error(`Session serialization problem: "${error.message}"`));
      }

      resolve(session);
    });
  }
}
