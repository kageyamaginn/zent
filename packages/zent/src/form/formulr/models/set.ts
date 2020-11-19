import {
  asapScheduler,
  BehaviorSubject,
  Observable,
  Subject,
  Subscription,
} from 'rxjs';
import { BasicModel, isModel } from './basic';
import { IMaybeError, ValidateOption } from '../validate';
import { Maybe, None, Some } from '../maybe';
import { IModel } from './base';
import isNil from '../../../utils/isNil';
import uniqueId from '../../../utils/uniqueId';
import isPlainObject from '../../../utils/isPlainObject';
import { UnknownFieldSetModelChildren } from '../utils';
import { observeOn } from 'rxjs/operators';

type $FieldSetValue<Children extends UnknownFieldSetModelChildren> = {
  [Key in keyof Children]: Children[Key] extends IModel<infer V> ? V : never;
};

const SET_ID = Symbol('set');

class FieldSetModel<
  Children extends UnknownFieldSetModelChildren = UnknownFieldSetModelChildren
> extends BasicModel<$FieldSetValue<Children>> {
  /**
   * @internal
   */
  [SET_ID]!: boolean;

  /** @internal */
  patchedValue: Partial<$FieldSetValue<Children>> | null = null;

  childRegister$ = new Subject<string>();

  childRemove$ = new Subject<string>();

  readonly children: Children = {} as Children;

  owner: IModel<any> | null = null;

  readonly value$ = new BehaviorSubject({} as $FieldSetValue<Children>);

  private readonly invalidModels: Set<BasicModel<unknown>> = new Set();

  private readonly mapModelToSubscriptions: Map<
    BasicModel<unknown>,
    Subscription[]
  > = new Map();

  /** @internal */
  constructor(children: Children, id = uniqueId('field-set-')) {
    super(id);
    const keys = Object.keys(children);
    const keysLength = keys.length;
    for (let index = 0; index < keysLength; index++) {
      const name = keys[index];
      const child = children[name];
      this.registerChild(name, child);
    }
    const $ = this.error$.subscribe(maybeError => {
      const selfValid = isNil(maybeError);
      this.valid$.next(selfValid && !this.invalidModels.size);
    });
    this.mapModelToSubscriptions.set(this as BasicModel<unknown>, [$]);
    this.children = children;
  }

  /**
   * 初始化 `FieldSet` 的值，并设置 `initialValue`
   * @param values 待初始化的值
   */
  initialize(values: $FieldSetValue<Children>) {
    if (!isPlainObject(values)) {
      return;
    }
    this.initialValue = Some(values);
    const keys = Object.keys(values);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = this.children[key] as BasicModel<unknown>;
      if (isModel(child)) {
        child.initialize(values[key]);
      }
    }
  }

  /**
   * @internal
   */
  getPatchedValue<T>(name: string): Maybe<T> {
    if (this.patchedValue && name in this.patchedValue) {
      return Some<T>(this.patchedValue[name] as T);
    }
    return None();
  }

  /**
   * 获取 `FieldSet` 的值
   */
  getRawValue(): $FieldSetValue<Children> {
    const value: any = {};
    const childrenKeys = Object.keys(this.children);
    for (let i = 0; i < childrenKeys.length; i++) {
      const key = childrenKeys[i];
      const model = this.children[key] as BasicModel<unknown>;
      const childValue = model.getRawValue();
      value[key] = childValue;
    }
    return value;
  }

  /**
   * 获取 `FieldSet` 用于表单提交的值
   */
  getSubmitValue() {
    const value: any = {};
    const childrenKeys = Object.keys(this.children);
    for (let i = 0; i < childrenKeys.length; i++) {
      const key = childrenKeys[i];
      const model = this.children[key] as BasicModel<unknown>;
      const childValue = model.getSubmitValue();
      value[key] = childValue;
    }
    return value;
  }

  /**
   * 在 `FieldSet` 上注册一个新的字段
   * @param name 字段名
   * @param model 字段对应的 model
   */
  registerChild(name: string, model: BasicModel<any>) {
    const children: UnknownFieldSetModelChildren = this.children;
    const prev = children[name];

    if (children.hasOwnProperty(name) && prev !== model) {
      this.removeChild(name);
    }
    model.owner = this;
    children[name] = model;
    if (prev !== model) {
      this._subscribeChild(name, model);
    }
    this.childRegister$.next(name);
  }

  /**
   * 在 `FieldSet` 上删除指定的字段
   * @param name 字段名
   */
  removeChild(name: string) {
    const model = this.children[name];
    model.owner = null;
    this._unsubscribeChild(model);
    delete this.children[name];
    const copy = { ...this.value$.value };
    delete copy[name];
    this.value$.next(copy);
    this.childRemove$.next(name);
    return model;
  }

  dispose() {
    super.dispose();
    this.mapModelToSubscriptions.forEach(subs =>
      subs.forEach(sub => sub.unsubscribe())
    );
    this.mapModelToSubscriptions.clear();
    this.invalidModels.clear();
    const { children } = this;
    Object.keys(children).forEach(key => {
      const child = children[key];
      child.dispose();
    });
  }

  /**
   * 更新 `FieldSet` 的值
   * @param value 待更新的值
   */
  patchValue(value: Partial<$FieldSetValue<Children>>) {
    if (!isPlainObject(value)) {
      return;
    }
    this.patchedValue = value as $FieldSetValue<Children>;
    const keys = Object.keys(value);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      if (this.children.hasOwnProperty(key)) {
        this.children[key]?.patchValue(value[key]);
      }
    }
  }

  /**
   * 清除 `FieldSet` 所有字段的值，同时清除 `initialValue`
   */
  clear() {
    const keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      this.children[key]?.clear();
    }
  }

  /**
   * 重置 `FieldValue` 所有字段的值，如果存在 `initialValue` 就是用初始值，否则使用默认值
   */
  reset() {
    const keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      this.children[key]?.reset();
    }
  }

  /**
   * 执行 `FieldSet` 的校验
   * @param option 校验的参数
   */
  validate(
    option = ValidateOption.Default
  ): Promise<IMaybeError<any> | IMaybeError<any>[]> {
    if (option & ValidateOption.IncludeChildrenRecursively) {
      const childOption = option | ValidateOption.StopPropagation;
      return Promise.all<IMaybeError<any>>(
        Object.keys(this.children)
          .map(key => this.children[key].validate(childOption))
          .concat(this.triggerValidate(option))
      );
    }
    return this.triggerValidate(option);
  }

  /**
   * 是否 `FieldSet` 上的所有字段都没有被修改过
   */
  pristine() {
    const keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = this.children[key];
      if (!child.pristine()) {
        return false;
      }
    }
    return true;
  }

  /**
   * 是否 `FieldSet` 上有任意字段被修改过
   *
   * `dirty === !pristine`
   */
  dirty() {
    return !this.pristine();
  }

  /**
   * 是否 `FieldSet` 上有任意字段被 touch 过
   *
   */
  touched() {
    const keys = Object.keys(this.children);
    for (let i = 0; i < keys.length; i += 1) {
      const key = keys[i];
      const child = this.children[key];
      if (child.touched()) {
        return true;
      }
    }
    return false;
  }

  /**
   * 返回指定字段名对应的 model
   * @param name 字段名
   */
  get<Name extends keyof Children>(
    name: Name
  ): Children[Name] | undefined | null {
    return this.children[name as string] as any;
  }

  /**
   * Subscribe `valid$` and `value$` of the model
   * @param model
   */
  private _subscribeChild(name: string, model: BasicModel<unknown>) {
    const { invalidModels, valid$, value$ } = this;
    this._subscribeObservable(model, model.valid$, valid => {
      if (valid) {
        invalidModels.delete(model);
      } else {
        invalidModels.add(model);
      }

      valid$.next(!invalidModels.size && isNil(this.error$.value));
    });
    this._subscribeObservable(model, model.value$, childValue => {
      /** 直接使用 getRawValue 便于实现，后续可以优化 value 更新的过程 */
      value$.next({ ...value$.value, [name]: childValue });
    });
  }

  /**
   * Unsubscribe `valid$` and `value$` of the model
   * @param model
   */
  private _unsubscribeChild(model: BasicModel<unknown>) {
    const subs = this.mapModelToSubscriptions.get(model);
    subs?.forEach(sub => sub.unsubscribe());
    this.mapModelToSubscriptions.delete(model);
  }

  /**
   * Subscribe a specified observable of the model
   * @param model as the key for mapping to subscription
   * @param observable
   * @param observer
   */
  private _subscribeObservable<T>(
    model: BasicModel<unknown>,
    observable: Observable<T>,
    observer: (value: T) => void
  ) {
    const { mapModelToSubscriptions } = this;
    const $ = observable.pipe(observeOn(asapScheduler)).subscribe(observer);
    const subs = mapModelToSubscriptions.get(model) || [];
    mapModelToSubscriptions.set(model, [...subs, $]);
  }
}

FieldSetModel.prototype[SET_ID] = true;

function isFieldSetModel<Children extends UnknownFieldSetModelChildren>(
  maybeModel: any
): maybeModel is FieldSetModel<Children> {
  return !!(maybeModel && maybeModel[SET_ID]);
}

export { FieldSetModel, $FieldSetValue, isFieldSetModel };
