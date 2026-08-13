export function Checkout() {
  return (
    <form>
      <label htmlFor="postal">Postal code</label>
      <input id="postal" name="postal_code" type="number" pattern="[0-9]{5}" required />

      <label htmlFor="middle">Middle name</label>
      <input id="middle" name="middle_name" required={true} />

      <label htmlFor="delivery">Delivery time</label>
      <input id="delivery" name="delivery_time" type="datetime-local" />
    </form>
  );
}
