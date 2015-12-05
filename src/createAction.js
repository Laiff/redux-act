import { ID } from './constants';
import constantCase from 'constant-case';
import invariant from 'invariant';

let id = 0;

const types = {};

const identity = arg => arg;
const undef = () => {};
const is = typeName => mayBe => typeof mayBe === typeName;
const isFunction = is('function');
const isString = is('string');

export default function createAction(type, payloadCreator, metaCreator) {

  if (isFunction(type)) {
    metaCreator = payloadCreator;
    payloadCreator = type;
    type = isString(payloadCreator.name) ?
      constantCase(payloadCreator.name) : undefined;
  }

  if (!isFunction(payloadCreator)) {
    payloadCreator = identity;
  }

  if (!isFunction(metaCreator)) {
    metaCreator = undef;
  }

  const isSerializable = (isString(type)) && /^[A-Z_]+$/.test(type);

  if (isSerializable) {
    invariant(!type in types, 'Duplicate action type: %s', type);
    types[type] = true;
  }

  const action = {
    id: isSerializable ? type : ++id,
    type: isSerializable ? type : `[${id}]${type ? ' ' + type : ''}`
  };

  let actionStores = undefined;

  function actionCreator(...args) {
    const payload = {
      [ID]: action.id,
      type: action.type,
      payload: payloadCreator(...args),
      meta: metaCreator(...args)
    };

    if (Array.isArray(actionStores)) {
      return actionStores.map(store => store.dispatch(payload));
    } else if (actionStores) {
      return actionStores.dispatch(payload);
    } else {
      return payload;
    }
  }

  actionCreator.toString = () => action.id;

  actionCreator.bindTo = stores => {
    actionStores = stores;
    return actionCreator;
  };

  return actionCreator;
};
