# Challenge tipo form de prueba

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis
nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
culpa qui officia deserunt mollit anim id est laborum.

## Perguntas

### What is the meaning of the universe?

Texto complementarion de la pregunta.

#### Solução

* `value`: 42

### A question with multiple choices

#### Opções

1. A
2. B
3. C

#### Solução

* `value`: 2

### An optional question with multiple choices

#### Opções

1. A
2. B
3. C

#### Solução

* `value`: 2
* `required`: false

### Cuáles de las siguientes crees que son correctas?

#### Opções

1. aaa
2. bbb
3. ccc

#### Solução

* `value`: 1,2

### Anything else to say?

¿Alguna cosa más que agregar?

#### Solução

* `required`: false

### A required question without validation

#### Solução

* `required`: true

### A question with custom validation

#### Solução

* `validate`:
  ```js
  (value) => {
    if (!value.startWith('https://blah.blah/')) {
      return 'Respuesta debe comenzr con https://blah.blah/';
    }
  }
  ```
