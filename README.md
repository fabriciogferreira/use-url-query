FEATURES FUTURAS:
- permitir alterar os nomes dos parâmetros: include, filter, sort, fields, append, etc (https://spatie.be/docs/laravel-query-builder/v6/installation-setup)
		exemplo sortAs: 'order',
- suporte a fields (https://spatie.be/docs/laravel-query-builder/v6/features/selecting-fields)
- atualização da URL
- add filter e remove filter devem ter autocomplete do schema passado
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
		//set...    void -> para setar algo que tem apenas um valor, exemplo: setPage
		//toggle... void -> para alternar o valor do param ou o parâmetro, exemplo: toggleSort
		//up??
		//swap??
		//enable??
		//disable??
- Poder aplicar a mesma estrutura de desativar valor do sort em filter, include e fields.
		em alguns casos, o usuário apenas quer desativar aquele filtro, e não remover ele, pode ser útil quando se está testando filtros
- permitir configuração de delimitadores para include, appends, fields, sorts, filters (https://spatie.be/docs/laravel-query-builder/v6/advanced-usage/multi-value-delimiter)
- opcão de não disparar atualização quando um valor sort (talvez), includes ou fields é removido, pois isso apenas não deveria mostrar um dados que já foi carregando, ou seja, não é preciso uma nova request/query para trazer um conjunto de dados B que está contido em um conjunto de dados A
- Poder adicionar filtros com operadores relacionais
	- EQUAL | = | addFilter | addFilter(key, value, )'=' 
	- NOT_EQUAL | != | addFilterNE | addFilter(key, value, '!=')
	- GREATER_THAN | > | addFilterGT | addFilter(key, value, '>')
	- LESS_THAN | < | addFilterLT | addFilter(key, value, '<')
	- GREATER_THAN_OR_EQUAL | >= | addFilterGTE | addFilter(key, value, '>=')
	- LESS_THAN_OR_EQUAL | <= | addFilterLTE | addFilter(key, value, '<=')
- Filtro debounced, o filtro é adicionado depois de um tempo (filterDebouncedBy)