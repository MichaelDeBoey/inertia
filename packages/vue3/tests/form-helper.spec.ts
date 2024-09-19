import test, { expect } from '@playwright/test'
import { pageLoads, shouldBeDumpPage } from './support'

test.describe('Form Helper', () => {
  test.describe('Methods', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)
      page.goto('/form-helper/methods')
      await page.check('#remember')
    })

    const data = [
      { method: 'post', label: 'POST' },
      { method: 'put', label: 'PUT' },
      { method: 'patch', label: 'PATCH' },
      { method: 'delete', label: 'DELETE' },
    ] as const

    data.forEach(({ method, label }) => {
      test(`can submit the form using the ${label} method`, async ({ page }) => {
        await page.getByRole('button', { name: `${label} form` }).click()

        const dump = await shouldBeDumpPage(page, method)

        await expect(dump.method).toEqual(method)
        await expect(dump.query).toEqual({})
        await expect(dump.form.name).toEqual('foo')
        await expect(dump.form.remember).toEqual(true)
      })
    })
  })

  test.describe('Transform', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)
      page.goto('/form-helper/transform')
      await page.check('#remember')
    })

    const data = [
      { method: 'post', label: 'POST', fooValue: 'bar' },
      { method: 'put', label: 'PUT', fooValue: 'baz' },
      { method: 'patch', label: 'PATCH', fooValue: 'foo' },
      { method: 'delete', label: 'DELETE', fooValue: 'bar' },
    ] as const

    data.forEach(({ method, label, fooValue }) => {
      test(`can transform the form prior to submission using the ${label} method`, async ({ page }) => {
        await page.getByRole('button', { name: `${label} form` }).click()

        const dump = await shouldBeDumpPage(page, method)

        await expect(dump.method).toEqual(method)
        await expect(dump.query).toEqual({})
        await expect(dump.form.name).toEqual(fooValue)
        await expect(dump.form.remember).toEqual(true)
      })
    })
  })

  test.describe('Errors', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)
      page.goto('/form-helper/errors')
      const errorsStatus = await page.locator('.errors-status')

      await expect(await errorsStatus.textContent()).toEqual('Form has no errors')

      await page.fill('#name', 'A')
      await page.fill('#handle', 'B')
      await page.check('#remember')
    })

    test('can display form errors', async ({ page }) => {
      await page.waitForSelector('.name_error', { state: 'detached' })
      await page.waitForSelector('.handle_error', { state: 'detached' })
      await page.waitForSelector('.remember_error', { state: 'detached' })

      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const nameError = await page.locator('.name_error')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await expect(await handleError.textContent()).toEqual('The Handle was invalid')
    })

    test('can clear all form errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const nameError = await page.locator('.name_error')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await expect(await handleError.textContent()).toEqual('The Handle was invalid')

      await page.getByRole('button', { name: 'Clear all errors' }).click()

      await page.waitForSelector('.name_error', { state: 'detached' })
      await page.waitForSelector('.handle_error', { state: 'detached' })
      await page.waitForSelector('.remember_error', { state: 'detached' })

      await expect(await errorsStatus.textContent()).toEqual('Form has no errors')
    })

    test('does not reset fields back to their initial values when it clears all form errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const nameError = await page.locator('.name_error')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await expect(await handleError.textContent()).toEqual('The Handle was invalid')

      await expect(await page.locator('#name').inputValue()).toEqual('A')
      await expect(await page.locator('#handle').inputValue()).toEqual('B')
      await expect(await page.locator('#remember').isChecked()).toEqual(true)

      await page.getByRole('button', { name: 'Clear all errors' }).click()

      await page.waitForSelector('.name_error', { state: 'detached' })
      await page.waitForSelector('.handle_error', { state: 'detached' })
      await page.waitForSelector('.remember_error', { state: 'detached' })

      await expect(await errorsStatus.textContent()).toEqual('Form has no errors')

      await expect(await page.locator('#name').inputValue()).toEqual('A')
      await expect(await page.locator('#handle').inputValue()).toEqual('B')
      await expect(await page.locator('#remember').isChecked()).toEqual(true)
    })

    test('can clear a subset of form errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const nameError = await page.locator('.name_error')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await expect(await handleError.textContent()).toEqual('The Handle was invalid')

      await page.getByRole('button', { name: 'Clear one error' }).click()

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await page.waitForSelector('.handle_error', { state: 'detached' })
      await page.waitForSelector('.remember_error', { state: 'detached' })
    })

    test('does not reset fields back to their initial values when it clears a subset of form errors', async ({
      page,
    }) => {
      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const nameError = await page.locator('.name_error')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await expect(await handleError.textContent()).toEqual('The Handle was invalid')

      await expect(await page.locator('#name').inputValue()).toEqual('A')
      await expect(await page.locator('#handle').inputValue()).toEqual('B')
      await expect(await page.locator('#remember').isChecked()).toEqual(true)

      await page.getByRole('button', { name: 'Clear one error' }).click()

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await nameError.textContent()).toEqual('Some name error')
      await page.waitForSelector('.handle_error', { state: 'detached' })
      await page.waitForSelector('.remember_error', { state: 'detached' })

      await expect(await page.locator('#name').inputValue()).toEqual('A')
      await expect(await page.locator('#handle').inputValue()).toEqual('B')
      await expect(await page.locator('#remember').isChecked()).toEqual(true)
    })

    test('can set a single error', async ({ page }) => {
      await page.getByRole('button', { name: 'Set one error' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })
      await page.waitForSelector('.name_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const handleError = await page.locator('.handle_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await handleError.textContent()).toEqual('Manually set Handle error')
    })

    test('can set multiple errors', async ({ page }) => {
      await page.getByRole('button', { name: 'Set errors' }).click()

      await expect(page).toHaveURL('form-helper/errors')

      await page.waitForSelector('.remember_error', { state: 'detached' })

      const errorsStatus = await page.locator('.errors-status')
      const handleError = await page.locator('.handle_error')
      const nameError = await page.locator('.name_error')

      await expect(await errorsStatus.textContent()).toEqual('Form has errors')
      await expect(await handleError.textContent()).toEqual('Manually set Handle error')
      await expect(await nameError.textContent()).toEqual('Manually set Name error')
    })
  })

  test.describe('Data', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)
      page.goto('/form-helper/data')
    })

    test('can reset all fields to their initial values', async ({ page }) => {
      await page.fill('#name', 'A')
      await page.check('#remember')

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('example')
      await expect(page.locator('#remember')).toBeChecked()

      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/data')

      await page.getByRole('button', { name: 'Reset all data' }).click()

      await expect(page.locator('#name')).toHaveValue('foo')
      await expect(page.locator('#handle')).toHaveValue('example')
      await expect(page.locator('#remember')).not.toBeChecked()
    })

    test('can reset a single field to its initial value', async ({ page }) => {
      await page.fill('#name', 'A')
      await page.fill('#handle', 'B')
      await page.check('#remember')

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('B')
      await expect(page.locator('#remember')).toBeChecked()

      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/data')

      await page.getByRole('button', { name: 'Reset one field' }).click()

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('example')
      await expect(page.locator('#remember')).toBeChecked()
    })

    test('does not reset errors when it resets one field to its initial value', async ({ page }) => {
      await page.fill('#name', 'A')
      await page.fill('#handle', 'B')
      await page.check('#remember')

      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/data')

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('B')
      await expect(page.locator('#remember')).toBeChecked()

      await expect(page.locator('.errors-status')).toHaveText('Form has errors')
      await expect(page.locator('.name_error')).toHaveText('Some name error')
      await expect(page.locator('.handle_error')).toHaveText('The Handle was invalid')

      await page.getByRole('button', { name: 'Reset one field' }).click()

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('example')
      await expect(page.locator('#remember')).toBeChecked()

      await expect(page.locator('.errors-status')).toHaveText('Form has errors')
      await expect(page.locator('.name_error')).toHaveText('Some name error')
      await expect(page.locator('.handle_error')).toHaveText('The Handle was invalid')
      await expect(page.locator('.remember_error')).not.toBeVisible()
    })

    test('does not reset errors when it resets all fields to their initial values', async ({ page }) => {
      await page.fill('#name', 'A')
      await page.fill('#handle', 'B')
      await page.check('#remember')

      await page.getByRole('button', { name: 'Submit form' }).click()

      await expect(page).toHaveURL('form-helper/data')

      await expect(page.locator('#name')).toHaveValue('A')
      await expect(page.locator('#handle')).toHaveValue('B')
      await expect(page.locator('#remember')).toBeChecked()

      await expect(page.locator('.errors-status')).toHaveText('Form has errors')
      await expect(page.locator('.name_error')).toHaveText('Some name error')
      await expect(page.locator('.handle_error')).toHaveText('The Handle was invalid')

      await page.getByRole('button', { name: 'Reset all data' }).click()

      await expect(page.locator('#name')).toHaveValue('foo')
      await expect(page.locator('#handle')).toHaveValue('example')
      await expect(page.locator('#remember')).not.toBeChecked()

      await expect(page.locator('.errors-status')).toHaveText('Form has errors')
      await expect(page.locator('.name_error')).toHaveText('Some name error')
      await expect(page.locator('.handle_error')).toHaveText('The Handle was invalid')
      await expect(page.locator('.remember_error')).not.toBeVisible()
    })

    test.describe('Update "reset" defaults', () => {
      test.beforeEach(async ({ page }) => {
        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('example')
        await expect(page.locator('#remember')).not.toBeChecked()
      })

      test('can assign the current values as the new defaults', async ({ page }) => {
        await page.fill('#name', 'A')
        await page.fill('#handle', 'B')
        await page.check('#remember')

        await page.getByRole('button', { name: 'Reassign current as defaults' }).click()

        await page.fill('#name', 'foo')
        await page.fill('#handle', 'example')
        await page.uncheck('#remember')

        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('example')
        await expect(page.locator('#remember')).not.toBeChecked()

        await page.getByRole('button', { name: 'Reset all data' }).click()

        await expect(page.locator('#name')).toHaveValue('A')
        await expect(page.locator('#handle')).toHaveValue('B')
        await expect(page.locator('#remember')).toBeChecked()
      })

      test('can assign new defaults for multiple fields', async ({ page }) => {
        await page.getByRole('button', { name: 'Reassign default values' }).click()

        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('example')
        await expect(page.locator('#remember')).not.toBeChecked()

        await page.getByRole('button', { name: 'Reset one field' }).click()

        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('updated handle')
        await expect(page.locator('#remember')).not.toBeChecked()

        await page.getByRole('button', { name: 'Reset all data' }).click()

        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('updated handle')
        await expect(page.locator('#remember')).toBeChecked()
      })

      test('can assign new default for a single field', async ({ page }) => {
        await page.getByRole('button', { name: 'Reassign single default' }).click()

        await expect(page.locator('#name')).toHaveValue('foo')
        await expect(page.locator('#handle')).toHaveValue('example')
        await expect(page.locator('#remember')).not.toBeChecked()

        await page.getByRole('button', { name: 'Reset all data' }).click()

        await expect(page.locator('#name')).toHaveValue('single value')
        await expect(page.locator('#handle')).toHaveValue('example')
        await expect(page.locator('#remember')).not.toBeChecked()
      })
    })
  })

  test.describe('Events', () => {
    test.beforeEach(async ({ page }) => {
      pageLoads.watch(page)
      await page.goto('/form-helper/events')
    })

    test.describe('onBefore', () => {
      test('fires when a request is about to be made', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onBefore' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[0]).toBe('onBefore')
        const visit = messages[1]

        await expect(visit).toHaveProperty('url')
        await expect(visit).toHaveProperty('method')
        await expect(visit).toHaveProperty('data')
        await expect(visit).toHaveProperty('headers')
        await expect(visit).toHaveProperty('preserveState')
      })

      test('can prevent the visit from starting by returning false', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onBefore cancellation' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(1)
        await expect(messages[0]).toBe('onBefore')
      })

      test('will reset the successful and recently successful statuses immediately when the form gets (re)submitted', async ({
        page,
      }) => {
        await expect(page.locator('.success-status')).toHaveText('Form was not successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was not recently successful')

        await page.getByRole('button', { exact: true, name: 'Submit form' }).click()

        await expect(page.locator('.success-status')).toHaveText('Form was successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was recently successful')

        await page.getByRole('button', { exact: true, name: 'onBefore cancellation' }).click()

        await expect(page.locator('.success-status')).toHaveText('Form was not successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was not recently successful')
      })
    })

    test.describe('onStart', () => {
      test('fires when the request has started', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onStart' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[2]).toBe('onStart')

        const visit = messages[3]

        await expect(visit).toHaveProperty('url')
        await expect(visit).toHaveProperty('method')
        await expect(visit).toHaveProperty('data')
        await expect(visit).toHaveProperty('headers')
        await expect(visit).toHaveProperty('preserveState')
      })

      test('marks the form as processing', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess resets processing' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[2]).toBe('onCancelToken')
        await expect(messages[3]).toBe(false)
        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBe(true)
      })
    })

    test.describe('onProgress', () => {
      test('fires when the form has files (and upload progression occurs)', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onProgress' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[3]).toBe('onProgress')
        const event = messages[4]

        await expect(event).toHaveProperty('percentage')
        await expect(event).toHaveProperty('total')
        await expect(event).toHaveProperty('loaded')
        await expect(event.percentage).toBeGreaterThanOrEqual(0)
        await expect(event.percentage).toBeLessThanOrEqual(100)
      })

      test('does not fire when the form has no files', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'progress no files' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(10)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe(null)
        await expect(messages[2]).toBe('onCancelToken')
        await expect(messages[3]).toBe(null)
        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBe(null)
        await expect(messages[6]).toBe('onSuccess')
        await expect(messages[7]).toBe(null)
        await expect(messages[8]).toBe('onFinish')
        await expect(messages[9]).toBe(null)
      })

      test('updates the progress property of the form', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess progress property' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBeNull()
        await expect(messages[6]).toBe('onProgress')

        const event = messages[7]

        await expect(event).toHaveProperty('percentage')
        await expect(event).toHaveProperty('total')
        await expect(event).toHaveProperty('loaded')
        await expect(event.percentage).toBeGreaterThanOrEqual(0)
        await expect(event.percentage).toBeLessThanOrEqual(100)
      })
    })

    test.describe('onCancel', () => {
      test('fires when the request was cancelled', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Cancellable Visit' }).click()

        await page.waitForTimeout(20)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[4]).toBe('onCancel')
      })
    })

    test.describe('onSuccess', () => {
      test('fires the request succeeds without validation errors', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe('onCancelToken')
        await expect(messages[2]).toBe('onStart')
        await expect(messages[3]).toBe('onSuccess')

        const pageData = messages[4]

        await expect(pageData).toHaveProperty('component')
        await expect(pageData).toHaveProperty('props')
        await expect(pageData).toHaveProperty('url')
        await expect(pageData).toHaveProperty('version')
      })

      test('marks the form as no longer processing', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess resets processing' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBe(true)
        await expect(messages[6]).toBe('onSuccess')
        await expect(messages[7]).toBe(false)
      })

      test('resets the progress property back to null', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess progress property' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[6]).toBe('onProgress')

        const event = messages[7]

        await expect(event).toHaveProperty('percentage')
        await expect(event).toHaveProperty('total')
        await expect(event).toHaveProperty('loaded')
        await expect(event.percentage).toBeGreaterThanOrEqual(0)
        await expect(event.percentage).toBeLessThanOrEqual(100)

        await expect(messages[8]).toBe('onSuccess')
        await expect(messages[9]).toBeNull()
      })

      test('can delay onFinish from firing by returning a promise', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess promise' }).click()

        await page.waitForTimeout(50)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe('onCancelToken')
        await expect(messages[2]).toBe('onStart')
        await expect(messages[3]).toBe('onSuccess')
        await expect(messages[4]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[5]).toBe('onFinish')
      })

      test('clears all existing errors and resets the hasErrors prop', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onSuccess resets errors' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages).toHaveLength(10)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe(false)
        await expect(messages[2]).toBe('onError')
        await expect(messages[3]).toBe(true)
        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBe(true)

        const errors = messages[6]

        await expect(errors).toHaveProperty('name')
        await expect(errors.name).toBe('Some name error')

        await expect(messages[7]).toBe('onSuccess')
        await expect(messages[8]).toBe(false)

        const successErrors = messages[9]

        await expect(successErrors).toEqual({})
      })

      test('will mark the form as being submitted successfully', async ({ page }) => {
        await expect(page.locator('.success-status')).toHaveText('Form was not successful')
        await page.getByRole('button', { exact: true, name: 'Submit form' }).click()
        await expect(page.locator('.success-status')).toHaveText('Form was successful')
      })

      test('will only mark the form as "recently successful" for two seconds', async ({ page }) => {
        await expect(page.locator('.success-status')).toHaveText('Form was not successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was not recently successful')

        await page.getByRole('button', { exact: true, name: 'Submit form' }).click()

        await expect(page.locator('.success-status')).toHaveText('Form was successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was recently successful')

        await page.waitForTimeout(2020)

        await expect(page.locator('.success-status')).toHaveText('Form was successful')
        await expect(page.locator('.recently-status')).toHaveText('Form was not recently successful')
      })
    })

    test.describe('onError', () => {
      test('fires when the request finishes with validation errors', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onError' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe('onCancelToken')
        await expect(messages[2]).toBe('onStart')
        await expect(messages[3]).toBe('onError')

        const errors = messages[4]

        await expect(errors).toHaveProperty('name')
        await expect(errors.name).toBe('Some name error')
      })

      test('marks the form as no longer processing', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onError resets processing' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[4]).toBe('onStart')
        await expect(messages[5]).toBe(true)
        await expect(messages[6]).toBe('onError')
        await expect(messages[7]).toBe(false)
      })

      test('resets the progress property back to null', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onError progress property' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[6]).toBe('onProgress')

        const event = messages[7]

        await expect(event).toHaveProperty('percentage')
        await expect(event).toHaveProperty('total')
        await expect(event).toHaveProperty('loaded')
        await expect(event.percentage).toBeGreaterThanOrEqual(0)
        await expect(event.percentage).toBeLessThanOrEqual(100)

        await expect(messages[8]).toBe('onError')
        await expect(messages[9]).toBeNull()
      })

      test('sets form errors', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Errors set on error' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[2]).toBe('onStart')
        await expect(messages[3]).toEqual({})
        await expect(messages[4]).toBe('onError')

        const errors = messages[5]

        await expect(errors).toHaveProperty('name')
        await expect(errors.name).toBe('Some name error')
      })

      test('can delay onFinish from firing by returning a promise', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'onError promise' }).click()

        await page.waitForTimeout(50)

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[0]).toBe('onBefore')
        await expect(messages[1]).toBe('onCancelToken')
        await expect(messages[2]).toBe('onStart')
        await expect(messages[3]).toBe('onError')
        await expect(messages[4]).toBe('onFinish should have been fired by now if Promise functionality did not work')
        await expect(messages[5]).toBe('onFinish')
      })
    })

    test.describe('onFinish', () => {
      test('fires when the request is completed', async ({ page }) => {
        await page.getByRole('button', { exact: true, name: 'Successful request' }).click()

        const messages = await page.evaluate(() => (window as any).messages)

        await expect(messages[4]).toBe('onFinish')
      })
    })
  })
})