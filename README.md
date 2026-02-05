FEATURES FUTURAS:
- suporte a fields (https://spatie.be/docs/laravel-query-builder/v6/features/selecting-fields)
- Suporte a appends
- normalização de valores vindos da URL para
-- sort //feito
-- field
-- append
-- include
-- filter //feito
- Poder aplicar a mesma estrutura de desativar valor do sort em filter, include e fields. Em alguns casos, o usuário apenas quer desativar aquele filtro, e não remover ele, pode ser útil quando se está testando filtros
- Poder adicionar filtros com operadores relacionais (https://spatie.be/docs/laravel-query-builder/v6/features/filtering#content-operator-filters)
-- EQUAL | = | addFilter | addFilter(key, value, )'=' 
-- NOT_EQUAL | != | addFilterNE | addFilter(key, value, '!=')
-- GREATER_THAN | > | addFilterGT | addFilter(key, value, '>')
-- LESS_THAN | < | addFilterLT | addFilter(key, value, '<')
-- GREATER_THAN_OR_EQUAL | >= | addFilterGTE | addFilter(key, value, '>=')
-- LESS_THAN_OR_EQUAL | <= | addFilterLTE | addFilter(key, value, '<=')
- suporte a https://github.com/spatie/laravel-json-api-paginate
- Laravel query builde segue: https://jsonapi.org/
- Ordem de precedência (url e with default) no momento 
-- valor url válido -> usa o dá url
-- valor url inválido -> cai no default
-- não tem valor -> cai no default
- add uma função set filters
- suporte a multi values do nuqs

EFICIÊNCIA:
- não iterar sobre o searchparams, iterar sobre o sort e o filters (usar searchparams.get)
- opcão de não disparar atualização quando um valor sort (talvez), includes ou fields é removido, pois isso apenas não deveria mostrar um dados que já foi carregando, ou seja, não é preciso uma novo request/query para trazer um conjunto de dados B que está contido em um conjunto de dados A

OPÇÕES:
- atualizar url opcionalmente
- permitir alterar o nome do sufixo de contagens, ex: usersCount => users_count
- permitir alterar o nome do sufixo do exists, ex: usersExists => users_exists
- permitir alterar os nomes dos parâmetros: fields, append, etc (https://spatie.be/docs/laravel-query-builder/v6/installation-setup)exemplo sortAs: 'order',
-- sort //feito
-- field
-- append
-- include //feito
-- filter //feito
- permitir configuração de delimitadores para include, appends, fields, sorts, filters (https://spatie.be/docs/laravel-query-builder/v6/advanced-usage/multi-value-delimiter)
-- sort
-- field
-- append
-- include
-- filter

TESTES:
- se não houver nada na url, sorts, filters e etc não devem ter nada
- criar backend para tests?

USO:
- Tenhas em mente o seguinte padrão:
-- add...    void -> para adicionar, exemplo: addFilter
-- clear...  void -> para limpar todos os valores de um param, exemplo: clearFilters
-- get...    value-> para buscar determinado valor: getFilter
-- has...    value-> para verificar se tem algo, exemplo: hasSort
-- is...     value-> para verificar se é tal coisa, exemplo: isSortDesc
-- move...	 void -> para move um item para determinada posição
-- remove... void -> para remover, exemplo: removeFilter
-- reset...  void -> para voltar os valores para os valores iniciais: resetFilters
-- set...    void -> para setar valor de um seto, exemplo: setFilter, vai remover os filtros atuais e adicionar pelos que foram setados
-- toggle... void -> para alternar o valor do param ou o parâmetro, exemplo: toggleSort
-- up??
-- swap??
-- enable??
-- disable??

//Nova implementação de filtersSchema
- é possivel enviar um parâmetro com valor string vazia ('')?, sim é, limpar filtro
- como vamos tirar um valor da url (nuqs tirando setando null no filtro)? sim, usar null para retirar parâmetro

MVP:
- debounce para atualização da url

Devo usar object ou array, ou os dois para filters, sorts, etc?
- Ver beneficios do programador vs beneficios de quem usa a lib 
- exemplo: se eu usar array de objetos, o usuário apenas precisa fazer:
sorts.map(...
mas para o programador alterar um atributo do sort, devo fazer:
sorts.findIndex(...

-exemplo2: se eu retornar um objeto, o usuário precisa fazer:
Object.entries(sorts).map(([key, config]) =>...
mas para o programador alterar um atributo do sort, devo fazer:
sorts[key].atribute = ...

ou devo usar os dois?
