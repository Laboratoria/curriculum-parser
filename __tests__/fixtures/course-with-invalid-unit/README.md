# Functional JavaScript

En este curso exploraremos el paradigma funcional en JavaScript así como varios
patrones, técnicas y convenciones asociadas a este paradigma, haciendo uso de
las nuevas características de ES2015.

La programación funcional es un paradigma de programación de suma relevancia hoy
en día, ya que se presta a resolver problemas de paralelización, asincronía y
programación reactiva entre otros. La programación funcional (_Functional
Programming_ o FP por sus siglas en inglés) no es realmente un paradigma nuevo,
existe desde hace medio siglo, pero recientemente, y en particular en el mundo
de JavaScript, se ha convertido en tanto una moda como una necesidad. Poco a
poco, desde la proliferación de librerías como [underscore][] y [lodash][],
después la adición de `map()`, `filter()`, `reduce()` y compañía, y ahora con
_frameworks_ como [React][] y [Redux][], conocer el paradigma funcional y estilo
declarativo se han convertido en una necesidad para cualquier desarrollador de
JavaScript.

Familiarizarnos con la programción funcional en JavaScript y ES2015 nos
permitirá más adelante desenvolvernos con naturalidad en React.

***Tags***: `functional`, `es6`, ...

## Público objetivo

Este curso está dirigido a desarrolladoras tanto _front-end_ como _back-end_.
JavaScript es un lenguaje de naturaleza funcional. En este curso aprenderás
sobre los principios de la programación funcional y cómo se reflejan en
JavaScript moderno.

## Requerimientos previos

Para poder llevar adelante este curso sin frustración, es recomendable los
siguientes conocimientos previos:

* Manejo de línea de comandos (\*nix) y `git`
* Manejo básico de `npm`
* Debes haber completado el curso de [paradigmas de programación](https://github.com/Laboratoria/bootcamp/tree/master/09-paradigms).

## Aprenderás

* ES2015
* Funciones puras
* Inmutabilidad
* Recursión
* _Higher Order Functions_
* Composición de funciones
* Refactorización
* Trabajo en equipo
* Revisión en pares o _Peer-review_
* Github issues, branches, pull requests, entre otros.

## Producto

* Refactorizar juego usado en lección 9 usando principios de programación
  funcional, ES6 y añadiendo un conjunto de pruebas.
* El "proyecto" está basado en iterar una aplicación existente y llevar a cabo
  su siguiente release usando metodología ágil.

***

## Syllabus

### Unidad 01: [Foo](01-foo)

En esta unidad veremos dos de los principios fundamentales de la programación
funcional: cómo evitar el estado compartido usando **funciones puras** y el
concepto de **inmutabilidad**. La duración estimada de esta unidad es de _3h_.

***

## Entregables y evaluación

* **Ejercicios**: Durante el curso completarás varios ejercicios en el LMS.
  Estos ejercicios incluyen tests automatizados con la intención de dar feedback
  immediato, pero los ejercicios en sí no serán calificados. Se elegirá uno o
  dos ejercicios junto con el proyecto para la sesión de _code review_, que sí
  será calificada.
* **Cuestionarios**: Al igual que los ejercicios, a lo largo del curso
  responderás varios cuestionarios con feedback immediato, y éstos no cuentan
  para la nota final.
* **Proyecto**: Antes de la sesión de _code review_ y las demos, cada alumna
  debe entregar (via pull request) el código de su proyecto. El proyecto incluye
  refactorizar varios módulos de una base de código existente.
* **Code review**: **(50%)** La última semana del curso tendrás una sesión de
  _code review_ con uno de lxs instructorxs. En esta sesión se revisará el
  código del proyecto así como uno o dos ejercicios realizados durante el curso.
* **Demo**: **(50%)** El curso cerrará con una demo en la que tendrás que
  presentar al resto de la clase el trabajo realizado y lo aprendido en el
  proyecto.

## Autor(es) / Colaboradores

* Milton Mazzarri (autor)
* Lupo Montero (coordinador)
* Ana Rangel (colaboradora)

## Libros

* [Functional JavaScript](http://shop.oreilly.com/product/0636920028857.do) de
  Michael Fogus
* [Eloquent JavaScript](http://eloquentjavascript.net/)

## Benchmarks

Cursos similares que sirven como referencia:

* [Introduction to Functional Programming](http://shop.oreilly.com/product/0636920052463.do),
  How to Think Functionally in (Almost) Any Language, Barry Burd, November 2016,
  O'Reilly Media

## Referencias

Capítulos de libros:

* [Eloquent JavaScript - Chapter 3: Functions](http://eloquentjavascript.net/03_functions.html)
* [Eloquent JavaScript - Chapter 5: Higher-Order Functions](http://eloquentjavascript.net/05_higher_order.html)

Blog posts:

* [Why Learn Functional Programming in JavaScript? (Composing Software)]( https://medium.com/javascript-scene/why-learn-functional-programming-in-javascript-composing-software-ea13afc7a257),
  Eric Elliott en Medium, Feb 20 2017
* [Master the JavaScript Interview: What is Functional Programming?]( https://medium.com/javascript-scene/master-the-javascript-interview-what-is-functional-programming-7f218c68b3a0),
  Eric Elliott en Medium, Jan 3 2017
* [Functional Programming In JavaScript — With Practical Examples (Part 1)]( https://medium.freecodecamp.com/functional-programming-in-js-with-practical-examples-part-1-87c2b0dbc276),
  Free Code Camp, @rajaraodv, Nov 14 2016
* [JavaScript and Functional Programming](https://bethallchurch.github.io/JavaScript-and-Functional-Programming/),
  Beth Allchurch, 29 of June, 2016
* [An introduction to functional programming](https://codewords.recurse.com/issues/one/an-introduction-to-functional-programming),
  Mary Rose Cook
* [Functional Programming in Javascript (Part 2)](https://medium.com/@y_kishino/functional-programming-in-javascript-part-2-78078df327a5)
  [@yyyk](https://medium.com/@y_kishino), Apr 16 2017 (needs review)
* [One webpack config to rule them all — environments that is](https://medium.com/@ryandrewjohnson/one-webpack-config-to-rule-them-all-environments-that-is-277457769779),
  [Ryan Johnson](https://medium.com/@ryandrewjohnson), Feb 12 2017
* [What are NPM, Yarn, Babel, and Webpack; and how to properly use them?](https://medium.com/front-end-hacking/what-are-npm-yarn-babel-and-webpack-and-how-to-properly-use-them-d835a758f987),
  [Gasim Gasimzada](https://medium.com/@gasim.appristas), May 9 2017 (needs review)

Videos:

* [Functional programming in JavaScript](https://www.youtube.com/playlist?list=PL0zVEGEvSaeEd9hlmCXrk5yUyqUag-n84),
  Mattias Petter Johansson.
* [Learning Functional Programming with JavaScript](https://www.youtube.com/watch?v=e-5obm1G_FY),
  Anjana Vakil, JSUnconf 2016
* [Functional programming and curry cooking in JS](https://www.youtube.com/watch?v=6Qx5ZAbfqjo),
  Stefanie Schirmer, JSConf EU 2015
* [Practical functional programming: pick two]( http://2014.jsconf.eu/speakers/james-coglan-practical-functional-programming-pick-two.html),
  James Coglan, JSConf EU 2014
* [Pure JavaScript](https://vimeo.com/49384334), Christian Johansen (@cjno), Sep
  13 2012

Otros recursos:

* [Glosario de términos de programación funcional](https://github.com/hemanth/functional-programming-jargon),
  @hemanth en GitHub.

[underscore]: http://underscorejs.org/
[lodash]: https://lodash.com/
[React]: https://facebook.github.io/react/
[Redux]: http://redux.js.org/
