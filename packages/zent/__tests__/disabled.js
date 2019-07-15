import React from 'react';
import ReactDOM from 'react-dom';

import { AutoComplete } from '../src/auto-complete';
import { Disabled } from '../src/disabled';
import { Button } from '../src/button';
import { Checkbox } from '../src/checkbox';
import { Input } from '../src/input';
import { NumberInput } from '../src/number-input';
import { Radio } from '../src/radio';
import { Rate } from '../src/rate';
import { Select } from '../src/select';
import { Slider } from '../src/slider';

it('disabled children', () => {
  const div = document.createElement('div');
  try {
    document.body.appendChild(div);
    div.id = 'root';
    ReactDOM.render(
      <Disabled>
        <AutoComplete />
        <Button type="primary">Disabled</Button>
        <Checkbox>Checkbox</Checkbox>
        <Input />
        <NumberInput />
        <Radio.Group>
          <Radio value="A">A</Radio>
          <Radio value="B">B</Radio>
          <Radio.Button value="C">C</Radio.Button>
        </Radio.Group>
        <Rate />
        <Select />
        <Slider />
      </Disabled>,
      div
    );
    expect(
      document.querySelectorAll('#root > .zent-auto-complete.disabled').length
    ).toBe(1);
    expect(
      document.querySelectorAll('#root > .zent-btn-disabled.zent-btn').length
    ).toBe(1);
    expect(
      document.querySelectorAll(
        '#root > .zent-input-wrapper.zent-input-wrapper__not-editable'
      ).length
    ).toBe(2);
    expect(
      document.querySelectorAll(
        '#root > .zent-checkbox-wrap.zent-checkbox-disabled'
      ).length
    ).toBe(1);
    expect(
      document.querySelectorAll(
        '#root > .zent-radio-group > .zent-radio-wrap.zent-radio-disabled'
      ).length
    ).toBe(2);
    expect(
      document.querySelectorAll(
        '#root > .zent-radio-group > .zent-radio-button.zent-radio-button--disabled'
      ).length
    ).toBe(1);
    expect(
      document.querySelectorAll('#root > .zent-rate.zent-rate-disabled').length
    ).toBe(1);
    expect(
      document.querySelectorAll('#root > .zent-select.disabled').length
    ).toBe(1);
    expect(
      document.querySelectorAll('#root > .zent-slider.zent-slider-disabled')
        .length
    ).toBe(1);
  } catch (error) {
    throw error;
  } finally {
    document.body.removeChild(div);
  }
});

it('self props has a higher priority', () => {
  const div = document.createElement('div');
  try {
    document.body.appendChild(div);
    div.id = 'root';
    ReactDOM.render(
      <Disabled>
        <AutoComplete disabled={false} />
        <Button type="primary" disabled={false}>
          Disabled
        </Button>
        <Checkbox disabled={false}>Checkbox</Checkbox>
        <Input disabled={false} />
        <NumberInput disabled={false} />
        <Radio.Group disabled={false}>
          <Radio value="A">A</Radio>
          <Radio value="B">B</Radio>
          <Radio.Button value="C">C</Radio.Button>
        </Radio.Group>
        <Rate disabled={false} />
        <Select disabled={false} />
        <Slider disabled={false} />
      </Disabled>,
      div
    );
    expect(
      document.querySelectorAll('#root > .zent-auto-complete.disabled').length
    ).toBe(0);
    expect(
      document.querySelectorAll('#root > .zent-btn-disabled.zent-btn').length
    ).toBe(0);
    expect(
      document.querySelectorAll(
        '#root > .zent-input-wrapper.zent-input-wrapper__not-editable'
      ).length
    ).toBe(0);
    expect(
      document.querySelectorAll(
        '#root > .zent-checkbox-wrap.zent-checkbox-disabled'
      ).length
    ).toBe(0);
    expect(
      document.querySelectorAll(
        '#root > .zent-radio-group > .zent-radio-wrap.zent-radio-disabled'
      ).length
    ).toBe(0);
    expect(
      document.querySelectorAll(
        '#root > .zent-radio-group > .zent-radio-button.zent-radio-button--disabled'
      ).length
    ).toBe(0);
    expect(
      document.querySelectorAll('#root > .zent-rate.zent-rate-disabled').length
    ).toBe(0);
    expect(
      document.querySelectorAll('#root > .zent-select.disabled').length
    ).toBe(0);
    expect(
      document.querySelectorAll('#root > .zent-slider.zent-slider-disabled')
        .length
    ).toBe(0);
  } catch (error) {
    throw error;
  } finally {
    document.body.removeChild(div);
  }
});