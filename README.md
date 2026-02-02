FEATURES FUTURAS:
- permitir alterar os nomes dos parâmetros: include, filter, sort, fields, append, etc (https://spatie.be/docs/laravel-query-builder/v6/installation-setup)
		exemplo sortAs: 'order',
- permitir alterar o nome do sufixo de contagens, ex: usersCount => users_count
- permitir alterar o nome do sufixo do exists, ex: usersExists => users_exists
- suporte a fields (https://spatie.be/docs/laravel-query-builder/v6/features/selecting-fields)
- Suporte a appends
- normalização de valores vindos da URL para
		includes
		appends
		fields
- Tenhas em mente o seguinte padrão:
		//add...    void -> para adicionar, exemplo: addFilter
		//clear...  void -> para limpar todos os valores de um param, exemplo: clearFilters
		//get...    value-> para buscar determinado valor: getFilter
		//has...    value-> para verificar se tem algo, exemplo: hasSort
		//is...     value-> para verificar se é tal coisa, exemplo: isSortDesc
		//move...		void -> para move um item para determinada posição
		//remove... void -> para remover, exemplo: removeFilter
		//reset...  void -> para voltar os valores para os valores iniciais: resetFilters
		//set...    void -> para setar valor de um seto, exemplo: setFilter, vai remover os filtros atuais e adicionar pelos que foram setados
		//toggle... void -> para alternar o valor do param ou o parâmetro, exemplo: toggleSort
		//up??
		//swap??
		//enable??
		//disable??
- Poder aplicar a mesma estrutura de desativar valor do sort em filter, include e fields.
		em alguns casos, o usuário apenas quer desativar aquele filtro, e não remover ele, pode ser útil quando se está testando filtros
- permitir configuração de delimitadores para include, appends, fields, sorts, filters (https://spatie.be/docs/laravel-query-builder/v6/advanced-usage/multi-value-delimiter)
- opcão de não disparar atualização quando um valor sort (talvez), includes ou fields é removido, pois isso apenas não deveria mostrar um dados que já foi carregando, ou seja, não é preciso uma nova request/query para trazer um conjunto de dados B que está contido em um conjunto de dados A
- Poder adicionar filtros com operadores relacionais (https://spatie.be/docs/laravel-query-builder/v6/features/filtering#content-operator-filters)
	- EQUAL | = | addFilter | addFilter(key, value, )'=' 
	- NOT_EQUAL | != | addFilterNE | addFilter(key, value, '!=')
	- GREATER_THAN | > | addFilterGT | addFilter(key, value, '>')
	- LESS_THAN | < | addFilterLT | addFilter(key, value, '<')
	- GREATER_THAN_OR_EQUAL | >= | addFilterGTE | addFilter(key, value, '>=')
	- LESS_THAN_OR_EQUAL | <= | addFilterLTE | addFilter(key, value, '<=')
- suporte a https://github.com/spatie/laravel-json-api-paginate
- Laravel query builde segue: https://jsonapi.org/
- Ordem de precedência (url e with default) no momento 
-- valor url válido -> usa o dá url
-- valor url inválido -> cai no default
-- não tem valor -> cai no default
- add uma função set filters


MVP:
- debounce para atualização da url


//informações
key e value sempre retorna uma string

//Nova implementação de filtersSchema
- mudar filtersSchema para filters
- funções do filtre devem ter autocomplete do objeto passado
- filtersSchema vai receber um objeto
- a chave das propriedades vão ser os possíveis filtros
- o valor das propriedades vão ser as configurações, ou ele pode receber:
-- um objeto
-- o que deve ser o valor padrão da propriedade que o usuário tem que passar caso ele não queria passar um  objeto? ele sempre deve passar um parser
- se um o filtro estiver definido na url, mas não tem valor de propriedade definido { name: ??? } e não coloca o valor (?filter[name]=), devo retornar uma string vazia ('') como é feito normalmente?, sim devo retornar uma string
- é possivel enviar um parâmetro com valor string vazia ('')?, sim é, limpar filtro
- como vamos tirar um valor da url (nuqs tirando setando null no filtro)? sim, usar null para retirar parâmetro
- não iterar sobre o searchparams, iterar sobre o sort e o filters (usar searchparams.get)
- como vamos tirar um valor da url (nuqs tirando setando null no filtro)? sim, usar null para retirar parâmetro