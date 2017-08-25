# course-parser

Parser de cursos para [curricula-js](https://github.com/Laboratoria/curricula-js).

```sh
# crea representación de curso a partir de directorio
course-parser 01-intro/README.md

# valida estructura y formato del curso
course-parser 01-intro/README.md --validate

# valida todos los cursos de una malla currícular (cada curso en una carpeta)
course-parser */README.md --validate
```
